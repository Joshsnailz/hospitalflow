import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AppointmentEntity } from './entities/appointment.entity';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  AppointmentFilterDto,
  CompleteAppointmentDto,
  AcceptAppointmentDto,
  RequestRescheduleDto,
} from './dto';
import { AppointmentEventPublisherService } from '../events/event-publisher.service';
import { RoundRobinService } from '../round-robin/round-robin.service';
import { AvailabilityService } from '../availability/availability.service';
import { RescheduleRequestsService } from '../reschedule-requests/reschedule-requests.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    private readonly eventPublisher: AppointmentEventPublisherService,
    private readonly roundRobinService: RoundRobinService,
    private readonly availabilityService: AvailabilityService,
    private readonly rescheduleRequestsService: RescheduleRequestsService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // ==================== Appointment CRUD ====================

  async create(
    dto: CreateAppointmentDto,
    currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
    authHeader?: string,
  ): Promise<AppointmentEntity> {
    const userId = currentUser.id;

    let patientId = dto.patientId || null;
    let patientChi = dto.patientChi || null;
    let patientName = dto.patientName || null;
    let doctorId = dto.doctorId || null;
    let doctorName = dto.doctorName || null;
    let scheduledDate = dto.scheduledDate ? new Date(dto.scheduledDate) : new Date();
    let status: string = 'scheduled';
    let priority = dto.priority || 'normal';
    let autoAssigned = false;
    let isEmergencyUnknown = false;

    // Check for time-overlap: same patient at the exact same scheduledDate
    if (patientId && scheduledDate) {
      const overlap = await this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.patientId = :patientId', { patientId })
        .andWhere('a.status NOT IN (:...excludeStatuses)', {
          excludeStatuses: ['cancelled', 'rescheduled', 'completed', 'no_show'],
        })
        .andWhere('a.scheduledDate = :scheduledDate', { scheduledDate })
        .getOne();
      if (overlap) {
        throw new BadRequestException(
          `Patient already has an appointment at this time (ID: ${overlap.id}). Choose a different time.`,
        );
      }
    }

    // Scenario-specific logic
    switch (dto.scenario) {
      case 'emergency':
        isEmergencyUnknown = dto.isEmergencyUnknown || false;
        priority = 'urgent';
        scheduledDate = new Date();
        status = 'pending_acceptance';

        if (!doctorId) {
          const assigned = await this.roundRobinService.getNextClinician(
            dto.hospitalId,
            dto.departmentId,
            authHeader,
          );
          if (assigned) {
            doctorId = assigned.clinicianId;
            doctorName = assigned.clinicianName;
            autoAssigned = true;
          }
        }
        break;

      case 'walk_in':
        scheduledDate = new Date();
        status = 'in_progress';

        if (!doctorId) {
          const assigned = await this.roundRobinService.getNextClinician(
            dto.hospitalId,
            dto.departmentId,
            authHeader,
          );
          if (assigned) {
            doctorId = assigned.clinicianId;
            doctorName = assigned.clinicianName;
            autoAssigned = true;
          }
        }
        break;

      case 'scheduled':
      default:
        if (dto.preferredClinicianId) {
          doctorId = dto.preferredClinicianId;
          doctorName = dto.preferredClinicianName || 'Preferred Clinician';
          status = 'scheduled';
        } else if (dto.autoAssign || (!doctorId && !doctorName)) {
          const assigned = await this.roundRobinService.getNextClinician(
            dto.hospitalId,
            dto.departmentId,
            authHeader,
          );
          if (assigned) {
            doctorId = assigned.clinicianId;
            doctorName = assigned.clinicianName;
            autoAssigned = true;
            status = 'scheduled';
          } else {
            status = 'pending_acceptance';
          }
        }
        break;
    }

    const appointment = this.appointmentRepository.create({
      patientId,
      patientChi,
      patientName,
      doctorId,
      doctorName,
      hospitalId: dto.hospitalId,
      departmentId: dto.departmentId || null,
      scenario: dto.scenario,
      appointmentType: dto.appointmentType,
      scheduledDate,
      endTime: dto.endTime ? new Date(dto.endTime) : null,
      durationMinutes: dto.durationMinutes || 30,
      status: status as any,
      priority,
      reason: dto.reason || null,
      notes: dto.notes || null,
      referredById: dto.referredById || null,
      autoAssigned,
      isEmergencyUnknown,
      emergencyAlias: dto.emergencyAlias || null,
      emergencyConditions: dto.emergencyConditions || null,
      preferredClinicianId: dto.preferredClinicianId || null,
      preferredClinicianName: dto.preferredClinicianName || null,
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

  async accept(
    id: string,
    dto: AcceptAppointmentDto,
    currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
    authHeader?: string,
  ): Promise<{ appointment: AppointmentEntity; encounter?: any; dischargeForm?: any }> {
    const appointment = await this.findOne(id);

    if (appointment.status !== 'pending_acceptance') {
      throw new BadRequestException(
        `Cannot accept appointment with status '${appointment.status}'. Must be 'pending_acceptance'.`,
      );
    }

    const clinicianName = currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.email;

    appointment.doctorId = currentUser.id;
    appointment.doctorName = clinicianName;
    appointment.acceptedById = currentUser.id;
    appointment.acceptedAt = new Date();
    appointment.status = 'confirmed';

    if (dto.notes) {
      appointment.notes = appointment.notes
        ? `${appointment.notes}\n${dto.notes}`
        : dto.notes;
    }

    const saved = await this.appointmentRepository.save(appointment);

    // Block the clinician's time slot
    const endTime = new Date(appointment.scheduledDate.getTime() + appointment.durationMinutes * 60000);
    await this.availabilityService.blockSlot(
      currentUser.id,
      saved.id,
      appointment.scheduledDate.toISOString(),
      endTime.toISOString(),
    );

    this.eventPublisher.publishAuditLog({
      userId: currentUser.id,
      action: 'appointment.accepted',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
    });

    // For walk-in/emergency: create encounter + discharge form
    let encounter: any = null;
    let dischargeForm: any = null;

    if ((appointment.scenario === 'emergency' || appointment.scenario === 'walk_in') && appointment.patientId) {
      try {
        const clinicalServiceUrl = this.configService.get('CLINICAL_SERVICE_URL', 'http://localhost:3006');
        const headers: Record<string, string> = {};
        if (authHeader) headers.Authorization = authHeader;

        const encRes = await firstValueFrom(
          this.httpService.post(`${clinicalServiceUrl}/encounters`, {
            patientId: appointment.patientId,
            patientChi: appointment.patientChi,
            hospitalId: appointment.hospitalId,
            departmentId: appointment.departmentId || undefined,
            encounterType: appointment.scenario === 'emergency' ? 'emergency' : 'outpatient',
            admittingDoctorId: currentUser.id,
            admissionDate: new Date().toISOString(),
            chiefComplaint: appointment.reason || undefined,
          }, { headers }),
        );
        encounter = encRes.data?.data;

        if (encounter?.id) {
          const disRes = await firstValueFrom(
            this.httpService.post(`${clinicalServiceUrl}/discharge`, {
              encounterId: encounter.id,
              patientId: appointment.patientId,
              patientChi: appointment.patientChi,
            }, { headers }),
          );
          dischargeForm = disRes.data?.data;
        }
      } catch (err) {
        this.logger.warn(`Failed to create encounter/discharge for apt ${id}: ${(err as Error).message}`);
      }
    }

    return { appointment: saved, encounter, dischargeForm };
  }

  async requestReschedule(
    id: string,
    dto: RequestRescheduleDto,
    currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
  ): Promise<{ appointment: AppointmentEntity; rescheduleRequest: any }> {
    const appointment = await this.findOne(id);

    appointment.status = 'pending_reschedule';
    const savedAppointment = await this.appointmentRepository.save(appointment);

    const rescheduleRequest = await this.rescheduleRequestsService.create(
      id,
      dto.reason,
      currentUser,
    );

    this.eventPublisher.publishAuditLog({
      userId: currentUser.id,
      action: 'appointment.reschedule_requested',
      resource: 'appointment',
      resourceId: id,
      status: 'success',
    });

    return { appointment: savedAppointment, rescheduleRequest };
  }

  async attend(
    id: string,
    currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
    authHeader?: string,
  ): Promise<{ appointment: AppointmentEntity; encounter?: any; dischargeForm?: any }> {
    const appointment = await this.findOne(id);
    if (!['confirmed', 'scheduled'].includes(appointment.status)) {
      throw new BadRequestException(
        `Cannot attend appointment with status '${appointment.status}'. Must be 'confirmed' or 'scheduled'.`,
      );
    }

    appointment.status = 'in_progress';
    const saved = await this.appointmentRepository.save(appointment);

    let encounter: any = null;
    let dischargeForm: any = null;

    if (appointment.patientId) {
      try {
        const clinicalServiceUrl = this.configService.get('CLINICAL_SERVICE_URL', 'http://localhost:3006');
        const headers: Record<string, string> = {};
        if (authHeader) headers.Authorization = authHeader;

        const encRes = await firstValueFrom(
          this.httpService.post(`${clinicalServiceUrl}/encounters`, {
            patientId: appointment.patientId,
            patientChi: appointment.patientChi,
            hospitalId: appointment.hospitalId,
            departmentId: appointment.departmentId || undefined,
            encounterType: appointment.scenario === 'emergency' ? 'emergency' : 'outpatient',
            admittingDoctorId: currentUser.id,
            admissionDate: new Date().toISOString(),
            chiefComplaint: appointment.reason || undefined,
          }, { headers }),
        );
        encounter = encRes.data?.data;

        if (encounter?.id) {
          const disRes = await firstValueFrom(
            this.httpService.post(`${clinicalServiceUrl}/discharge`, {
              encounterId: encounter.id,
              patientId: appointment.patientId,
              patientChi: appointment.patientChi,
            }, { headers }),
          );
          dischargeForm = disRes.data?.data;
        }
      } catch (err) {
        this.logger.warn(`Failed to create encounter/discharge for attend apt ${id}: ${(err as Error).message}`);
      }
    }

    this.eventPublisher.publishAuditLog({
      userId: currentUser.id,
      action: 'appointment.attended',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
    });

    return { appointment: saved, encounter, dischargeForm };
  }

  async requestCancel(
    id: string,
    reason: string,
    currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
  ): Promise<{ appointment: AppointmentEntity; cancelRequest: any }> {
    const appointment = await this.findOne(id);
    if (appointment.status === 'cancelled') {
      throw new BadRequestException('Appointment is already cancelled');
    }

    const cancelRequest = await this.rescheduleRequestsService.create(
      id, reason, currentUser, 'cancel',
    );

    this.eventPublisher.publishAuditLog({
      userId: currentUser.id,
      action: 'appointment.cancel_requested',
      resource: 'appointment',
      resourceId: id,
      status: 'success',
    });

    return { appointment, cancelRequest };
  }

  async getQueue(hospitalId?: string): Promise<AppointmentEntity[]> {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.status = :status', { status: 'pending_acceptance' });

    if (hospitalId) {
      queryBuilder.andWhere('appointment.hospitalId = :hospitalId', { hospitalId });
    }

    queryBuilder
      .addOrderBy(
        `CASE appointment.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`,
        'ASC',
      )
      .addOrderBy('appointment.createdAt', 'ASC');

    return queryBuilder.getMany();
  }

  async findAll(filterDto: AppointmentFilterDto): Promise<{
    data: AppointmentEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { doctorId, patientId, status, appointmentType, scenario, dateFrom, dateTo } = filterDto;
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

    if (scenario) {
      queryBuilder.andWhere('appointment.scenario = :scenario', { scenario });
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

    // Release availability for the old appointment
    if (oldAppointment.doctorId) {
      await this.availabilityService.releaseSlot(oldAppointment.doctorId, id);
    }

    oldAppointment.status = 'rescheduled';
    oldAppointment.notes = oldAppointment.notes
      ? `${oldAppointment.notes}\nRescheduled: ${dto.reason || 'No reason provided'}`
      : `Rescheduled: ${dto.reason || 'No reason provided'}`;
    await this.appointmentRepository.save(oldAppointment);

    const newAppointment = this.appointmentRepository.create({
      patientId: oldAppointment.patientId,
      patientChi: oldAppointment.patientChi,
      patientName: oldAppointment.patientName,
      doctorId: oldAppointment.doctorId,
      doctorName: oldAppointment.doctorName,
      hospitalId: oldAppointment.hospitalId,
      departmentId: oldAppointment.departmentId,
      scenario: oldAppointment.scenario,
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

    // Release availability
    if (appointment.doctorId) {
      await this.availabilityService.releaseSlot(appointment.doctorId, id);
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

    // Release availability
    if (appointment.doctorId) {
      await this.availabilityService.releaseSlot(appointment.doctorId, id);
    }

    const savedAppointment = await this.appointmentRepository.save(appointment);

    let encounter: any;

    if (dto.createEncounter && appointment.patientId) {
      try {
        const clinicalServiceUrl = this.configService.get(
          'CLINICAL_SERVICE_URL',
          'http://localhost:3006',
        );

        const encounterData = {
          patientId: appointment.patientId,
          patientChi: appointment.patientChi,
          hospitalId: dto.hospitalId || appointment.hospitalId,
          departmentId: dto.departmentId || appointment.departmentId || undefined,
          encounterType: dto.encounterType || 'outpatient',
          wardId: dto.wardId,
          bedId: dto.bedId,
          chiefComplaint: dto.chiefComplaint,
          admissionDiagnosis: dto.admissionDiagnosis,
          admittingDoctorId: appointment.doctorId,
          admissionDate: new Date().toISOString(),
        };

        const response = await firstValueFrom(
          this.httpService.post(`${clinicalServiceUrl}/encounters`, encounterData),
        );
        encounter = response.data;
      } catch (err) {
        this.logger.warn(
          `Failed to create encounter from appointment ${id}: ${(err as Error).message}`,
        );
      }
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
  ): Promise<AppointmentEntity> {
    const originalAppointment = await this.findOne(appointmentId);

    const referralAppointment = this.appointmentRepository.create({
      patientId: originalAppointment.patientId,
      patientChi: originalAppointment.patientChi,
      patientName: originalAppointment.patientName,
      doctorId: newDoctorId,
      doctorName: 'Referred Doctor',
      hospitalId: originalAppointment.hospitalId,
      departmentId: originalAppointment.departmentId,
      scenario: originalAppointment.scenario,
      appointmentType: 'referral',
      scheduledDate: new Date(),
      durationMinutes: 30,
      priority: originalAppointment.priority,
      reason: reason,
      notes: `Referred from appointment ${appointmentId} by doctor ${originalAppointment.doctorId}`,
      referredById: originalAppointment.doctorId,
      createdBy: originalAppointment.createdBy,
    });

    return this.appointmentRepository.save(referralAppointment);
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats(userId?: string, role?: string): Promise<Record<string, unknown>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (role === 'doctor' || role === 'consultant') {
      const [todayAppointments, upcomingAppointments, completedToday, pendingAcceptance] = await Promise.all([
        this.appointmentRepository
          .createQueryBuilder('a')
          .where('a.doctorId = :userId', { userId })
          .andWhere('a.scheduledDate >= :today', { today: today.toISOString() })
          .andWhere('a.scheduledDate < :tomorrow', { tomorrow: tomorrow.toISOString() })
          .andWhere('a.status NOT IN (:...excludeStatuses)', {
            excludeStatuses: ['cancelled', 'rescheduled'],
          })
          .getCount(),

        this.appointmentRepository
          .createQueryBuilder('a')
          .where('a.doctorId = :userId', { userId })
          .andWhere('a.scheduledDate >= :now', { now: new Date().toISOString() })
          .andWhere('a.status IN (:...statuses)', {
            statuses: ['scheduled', 'confirmed'],
          })
          .getCount(),

        this.appointmentRepository
          .createQueryBuilder('a')
          .where('a.doctorId = :userId', { userId })
          .andWhere('a.scheduledDate >= :today', { today: today.toISOString() })
          .andWhere('a.scheduledDate < :tomorrow', { tomorrow: tomorrow.toISOString() })
          .andWhere('a.status = :status', { status: 'completed' })
          .getCount(),

        this.appointmentRepository
          .createQueryBuilder('a')
          .where('a.status = :status', { status: 'pending_acceptance' })
          .getCount(),
      ]);

      return {
        todayAppointments,
        upcomingAppointments,
        completedToday,
        pendingAcceptance,
      };
    }

    // Admin / default
    const [totalToday, totalUpcoming, cancelledToday, pendingAcceptance, pendingReschedule] = await Promise.all([
      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.scheduledDate >= :today', { today: today.toISOString() })
        .andWhere('a.scheduledDate < :tomorrow', { tomorrow: tomorrow.toISOString() })
        .getCount(),

      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.scheduledDate >= :now', { now: new Date().toISOString() })
        .andWhere('a.status IN (:...statuses)', {
          statuses: ['scheduled', 'confirmed'],
        })
        .getCount(),

      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.scheduledDate >= :today', { today: today.toISOString() })
        .andWhere('a.scheduledDate < :tomorrow', { tomorrow: tomorrow.toISOString() })
        .andWhere('a.status = :status', { status: 'cancelled' })
        .getCount(),

      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.status = :status', { status: 'pending_acceptance' })
        .getCount(),

      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.status = :status', { status: 'pending_reschedule' })
        .getCount(),
    ]);

    return {
      totalToday,
      totalUpcoming,
      cancelledToday,
      pendingAcceptance,
      pendingReschedule,
    };
  }
}
