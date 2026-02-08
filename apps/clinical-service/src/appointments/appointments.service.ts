import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { AppointmentEntity } from './entities/appointment.entity';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  AppointmentFilterDto,
  CompleteAppointmentDto,
} from './dto';
import { ClinicalEventPublisherService } from '../events/event-publisher.service';
import { EncountersService } from '../encounters/encounters.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    private readonly eventPublisher: ClinicalEventPublisherService,
    private readonly encountersService: EncountersService,
  ) {}

  // ==================== Appointment CRUD ====================

  async create(dto: CreateAppointmentDto, userId?: string): Promise<AppointmentEntity> {
    let doctorId = dto.doctorId;
    let doctorName = dto.doctorName;
    let autoAssigned = false;

    // Combine scheduledDate + scheduledTime if needed
    let scheduledDate = dto.scheduledDate;
    if (dto.scheduledTime && scheduledDate && !scheduledDate.includes('T')) {
      scheduledDate = `${scheduledDate}T${dto.scheduledTime}:00.000Z`;
    }

    // Resolve durationMinutes from either field
    const durationMinutes = dto.durationMinutes ?? dto.duration ?? 30;

    if (dto.autoAssign) {
      const assigned = await this.autoAssignDoctor(
        dto.patientId,
        dto.hospitalId,
        dto.departmentId,
        dto.appointmentType,
        scheduledDate,
      );
      if (assigned) {
        doctorId = assigned.doctorId;
        doctorName = assigned.doctorName;
        autoAssigned = true;
      }
    }

    const appointment = this.appointmentRepository.create({
      ...dto,
      scheduledDate,
      durationMinutes,
      doctorId,
      doctorName,
      autoAssigned,
      createdBy: userId,
    });

    const saved = await this.appointmentRepository.save(appointment);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'appointment.created',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async autoAssignDoctor(
    patientId: string,
    hospitalId: string,
    departmentId?: string,
    appointmentType?: string,
    scheduledDate?: string,
  ): Promise<{ doctorId: string; doctorName: string } | null> {
    // Step 1: Look for previous completed appointments with same patient - prefer that doctor
    const previousAppointment = await this.appointmentRepository.findOne({
      where: {
        patientId,
        status: 'completed' as const,
      },
      order: { scheduledDate: 'DESC' },
    });

    if (previousAppointment?.doctorId) {
      return {
        doctorId: previousAppointment.doctorId,
        doctorName: previousAppointment.doctorName || 'Doctor',
      };
    }

    // Step 2: Find doctors from existing appointments in the same department/hospital
    // and pick the one with fewest appointments on the requested date
    if (scheduledDate) {
      const dateStart = new Date(scheduledDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(scheduledDate);
      dateEnd.setHours(23, 59, 59, 999);

      const queryBuilder = this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('appointment.doctor_id', 'doctorId')
        .addSelect('appointment.doctor_name', 'doctorName')
        .addSelect('COUNT(*)', 'appointmentCount')
        .where('appointment.hospital_id = :hospitalId', { hospitalId });

      if (departmentId) {
        queryBuilder.andWhere('appointment.department_id = :departmentId', { departmentId });
      }

      queryBuilder
        .andWhere('appointment.scheduled_date >= :dateStart', { dateStart })
        .andWhere('appointment.scheduled_date <= :dateEnd', { dateEnd })
        .andWhere('appointment.status NOT IN (:...excludeStatuses)', {
          excludeStatuses: ['cancelled', 'rescheduled'],
        })
        .groupBy('appointment.doctor_id')
        .addGroupBy('appointment.doctor_name')
        .orderBy('"appointmentCount"', 'ASC')
        .limit(1);

      const result = await queryBuilder.getRawOne();

      if (result) {
        return {
          doctorId: result.doctorId,
          doctorName: result.doctorName,
        };
      }
    }

    // No doctor found for auto-assignment
    return null;
  }

  async findAll(filterDto: AppointmentFilterDto): Promise<{
    data: AppointmentEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { doctorId, patientId, status, appointmentType, dateFrom, dateTo } = filterDto;
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 10;
    const sortBy = filterDto.sortBy ?? 'scheduledDate';
    const sortOrder = filterDto.sortOrder ?? 'ASC';

    const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment');

    if (doctorId) {
      queryBuilder.andWhere('appointment.doctorId = :doctorId', { doctorId });
    }

    if (patientId) {
      queryBuilder.andWhere('appointment.patientId = :patientId', { patientId });
    }

    if (status) {
      queryBuilder.andWhere('appointment.status = :status', { status });
    }

    if (appointmentType) {
      queryBuilder.andWhere('appointment.appointmentType = :appointmentType', { appointmentType });
    }

    if (dateFrom) {
      queryBuilder.andWhere('appointment.scheduledDate >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('appointment.scheduledDate <= :dateTo', { dateTo });
    }

    const validSortFields = ['scheduledDate', 'createdAt', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'scheduledDate';

    queryBuilder.orderBy(`appointment.${sortField}`, sortOrder);

    const total = await queryBuilder.getCount();

    queryBuilder.skip((page - 1) * limit).take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto, userId?: string): Promise<AppointmentEntity> {
    const appointment = await this.findOne(id);

    Object.assign(appointment, dto);

    const saved = await this.appointmentRepository.save(appointment);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'appointment.updated',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async reschedule(id: string, dto: RescheduleAppointmentDto): Promise<AppointmentEntity> {
    const oldAppointment = await this.findOne(id);

    // Mark old appointment as rescheduled
    oldAppointment.status = 'rescheduled';
    oldAppointment.notes = oldAppointment.notes
      ? `${oldAppointment.notes}\nRescheduled: ${dto.reason || 'No reason provided'}`
      : `Rescheduled: ${dto.reason || 'No reason provided'}`;
    await this.appointmentRepository.save(oldAppointment);

    // Create new appointment with the new date
    const newAppointment = this.appointmentRepository.create({
      patientId: oldAppointment.patientId,
      patientChi: oldAppointment.patientChi,
      patientName: oldAppointment.patientName,
      doctorId: oldAppointment.doctorId,
      doctorName: oldAppointment.doctorName,
      hospitalId: oldAppointment.hospitalId,
      departmentId: oldAppointment.departmentId,
      appointmentType: oldAppointment.appointmentType,
      scheduledDate: new Date(dto.newDate),
      durationMinutes: oldAppointment.durationMinutes,
      priority: oldAppointment.priority,
      reason: oldAppointment.reason,
      notes: dto.reason ? `Rescheduled from ${oldAppointment.scheduledDate.toISOString()}: ${dto.reason}` : null,
      referredById: oldAppointment.referredById,
      createdBy: oldAppointment.createdBy,
    });

    const saved = await this.appointmentRepository.save(newAppointment);

    this.eventPublisher.publishAuditLog({
      action: 'appointment.rescheduled',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async cancel(id: string, reason?: string, userId?: string): Promise<AppointmentEntity> {
    const appointment = await this.findOne(id);

    if (appointment.status === 'cancelled') {
      throw new BadRequestException('Appointment is already cancelled');
    }

    appointment.status = 'cancelled';
    appointment.notes = appointment.notes
      ? `${appointment.notes}\nCancelled: ${reason || 'No reason provided'}`
      : `Cancelled: ${reason || 'No reason provided'}`;

    const saved = await this.appointmentRepository.save(appointment);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'appointment.cancelled',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async checkIn(id: string, userId?: string): Promise<AppointmentEntity> {
    const appointment = await this.findOne(id);

    if (appointment.status !== 'scheduled' && appointment.status !== 'confirmed') {
      throw new BadRequestException(
        `Cannot check in appointment with status '${appointment.status}'. Appointment must be 'scheduled' or 'confirmed'.`,
      );
    }

    appointment.status = 'in_progress';

    const saved = await this.appointmentRepository.save(appointment);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'appointment.checked_in',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async complete(
    id: string,
    dto: CompleteAppointmentDto,
    userId?: string,
  ): Promise<{ appointment: AppointmentEntity; encounter?: any }> {
    const appointment = await this.findOne(id);

    if (appointment.status !== 'in_progress') {
      throw new BadRequestException(
        `Cannot complete appointment with status '${appointment.status}'. Appointment must be 'in_progress'.`,
      );
    }

    appointment.status = 'completed';

    if (dto.notes) {
      appointment.notes = appointment.notes
        ? `${appointment.notes}\n${dto.notes}`
        : dto.notes;
    }

    const savedAppointment = await this.appointmentRepository.save(appointment);

    let encounter: any;

    if (dto.createEncounter) {
      encounter = await this.encountersService.create(
        {
          patientId: appointment.patientId,
          patientChi: appointment.patientChi,
          hospitalId: dto.hospitalId || appointment.hospitalId,
          departmentId: dto.departmentId || appointment.departmentId || undefined,
          encounterType: (dto.encounterType || 'outpatient') as any,
          wardId: dto.wardId,
          bedId: dto.bedId,
          chiefComplaint: dto.chiefComplaint,
          admissionDiagnosis: dto.admissionDiagnosis,
          admittingDoctorId: appointment.doctorId,
          admissionDate: new Date().toISOString(),
        },
        userId,
      );
    }

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'appointment.completed',
      resource: 'appointment',
      resourceId: savedAppointment.id,
      status: 'success',
    });

    return { appointment: savedAppointment, encounter };
  }

  async getUpcomingByDoctor(doctorId: string, limit?: number): Promise<AppointmentEntity[]> {
    const now = new Date();

    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctorId = :doctorId', { doctorId })
      .andWhere('appointment.scheduledDate >= :now', { now })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: ['scheduled', 'confirmed'],
      })
      .orderBy('appointment.scheduledDate', 'ASC');

    if (limit) {
      queryBuilder.take(limit);
    }

    return queryBuilder.getMany();
  }

  async getByPatient(patientId: string): Promise<AppointmentEntity[]> {
    return this.appointmentRepository.find({
      where: { patientId },
      order: { scheduledDate: 'DESC' },
    });
  }

  async refer(
    appointmentId: string,
    newDoctorId: string,
    reason: string,
    userId?: string,
  ): Promise<AppointmentEntity> {
    const originalAppointment = await this.findOne(appointmentId);
    const previousStatus = originalAppointment.status;

    // Close the original appointment so it leaves the referring clinician's queue
    originalAppointment.status = 'cancelled';
    originalAppointment.notes = originalAppointment.notes
      ? `${originalAppointment.notes}\nReferred to ${newDoctorId}: ${reason || 'No reason provided'}`
      : `Referred to ${newDoctorId}: ${reason || 'No reason provided'}`;
    await this.appointmentRepository.save(originalAppointment);

    // Create the new referral appointment for the receiving clinician
    const referralAppointment = this.appointmentRepository.create({
      patientId: originalAppointment.patientId,
      patientChi: originalAppointment.patientChi,
      patientName: originalAppointment.patientName,
      doctorId: newDoctorId,
      doctorName: 'Referred Doctor',
      hospitalId: originalAppointment.hospitalId,
      departmentId: originalAppointment.departmentId,
      appointmentType: 'referral',
      scheduledDate: new Date(),
      durationMinutes: originalAppointment.durationMinutes,
      priority: originalAppointment.priority,
      reason: reason,
      notes: `Referred from appointment ${appointmentId} by doctor ${originalAppointment.doctorId}`,
      referredById: originalAppointment.doctorId,
      createdBy: userId || originalAppointment.createdBy,
    });

    const saved = await this.appointmentRepository.save(referralAppointment);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'appointment.referred',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
      oldValues: {
        appointmentId,
        originalDoctorId: originalAppointment.doctorId,
        originalStatus: previousStatus,
      },
      newValues: {
        referralAppointmentId: saved.id,
        newDoctorId,
        reason,
      },
    });

    return saved;
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats(userId?: string, role?: string): Promise<Record<string, unknown>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (role === 'doctor' || role === 'consultant') {
      const todayAppointments = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.doctorId = :userId', { userId })
        .andWhere('appointment.scheduledDate >= :today', { today: today.toISOString() })
        .andWhere('appointment.scheduledDate < :tomorrow', { tomorrow: tomorrow.toISOString() })
        .andWhere('appointment.status NOT IN (:...excludeStatuses)', {
          excludeStatuses: ['cancelled', 'rescheduled'],
        })
        .getCount();

      const upcomingAppointments = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.doctorId = :userId', { userId })
        .andWhere('appointment.scheduledDate >= :now', { now: new Date().toISOString() })
        .andWhere('appointment.status IN (:...statuses)', {
          statuses: ['scheduled', 'confirmed'],
        })
        .getCount();

      const completedToday = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.doctorId = :userId', { userId })
        .andWhere('appointment.scheduledDate >= :today', { today: today.toISOString() })
        .andWhere('appointment.scheduledDate < :tomorrow', { tomorrow: tomorrow.toISOString() })
        .andWhere('appointment.status = :status', { status: 'completed' })
        .getCount();

      return {
        todayAppointments,
        upcomingAppointments,
        completedToday,
      };
    }

    // Admin / default
    const totalToday = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.scheduledDate >= :today', { today: today.toISOString() })
      .andWhere('appointment.scheduledDate < :tomorrow', { tomorrow: tomorrow.toISOString() })
      .getCount();

    const totalUpcoming = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.scheduledDate >= :now', { now: new Date().toISOString() })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: ['scheduled', 'confirmed'],
      })
      .getCount();

    const cancelledToday = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.scheduledDate >= :today', { today: today.toISOString() })
      .andWhere('appointment.scheduledDate < :tomorrow', { tomorrow: tomorrow.toISOString() })
      .andWhere('appointment.status = :status', { status: 'cancelled' })
      .getCount();

    return {
      totalToday,
      totalUpcoming,
      cancelledToday,
    };
  }
}
