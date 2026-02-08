import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
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
import { QueueService } from './services/queue.service';
import { AssignmentService, AssignmentStrategy } from './services/assignment.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    private readonly eventPublisher: ClinicalEventPublisherService,
    private readonly encountersService: EncountersService,
    private readonly httpService: HttpService,
    private readonly queueService: QueueService,
    private readonly assignmentService: AssignmentService,
  ) {}

  // ==================== Appointment CRUD ====================

  async create(dto: CreateAppointmentDto, userId?: string): Promise<AppointmentEntity> {
    // Create appointment with PENDING status (no clinician assigned yet)
    const appointment = this.appointmentRepository.create({
      ...dto,
      doctorId: null,
      doctorName: null,
      autoAssigned: false,
      assignmentStatus: 'pending',
      createdBy: userId,
    });

    const saved = await this.appointmentRepository.save(appointment);

    // Add to queue
    const queuePosition = await this.queueService.addToQueue(
      saved.id,
      saved.hospitalId,
      saved.departmentId,
    );

    this.logger.log(`Appointment ${saved.id} added to queue at position ${queuePosition}`);

    // If auto-assign enabled, assign immediately using selected strategy
    if (dto.autoAssign) {
      const strategy: AssignmentStrategy = (dto as any).assignmentStrategy || 'workload';
      const assigned = await this.assignmentService.autoAssignClinician(saved.id, strategy);

      if (assigned) {
        await this.assignClinician(saved.id, assigned.clinicianId, userId);
        this.logger.log(`Auto-assigned appointment ${saved.id} to clinician ${assigned.clinicianId}`);
      }
    }

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'CREATE',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
      details: `Appointment created and added to queue at position ${queuePosition}. Auto-assign: ${dto.autoAssign ? 'enabled' : 'disabled'}`,
    });

    // Refetch to get updated data after assignment
    return this.findOne(saved.id);
  }

  async autoAssignDoctor(
    patientId: string,
    hospitalId: string,
    departmentId?: string,
    appointmentType?: string,
    scheduledDate?: string,
  ): Promise<{ doctorId: string; doctorName: string } | null> {
    // Step 1: Look for previous completed appointments with same patient - prefer that clinician
    const previousAppointment = await this.appointmentRepository.findOne({
      where: {
        patientId,
        status: 'completed' as const,
      },
      order: { scheduledDate: 'DESC' },
    });

    if (previousAppointment && previousAppointment.doctorId) {
      // Verify the clinician is still active in user-service
      try {
        const response = await this.httpService.axiosRef.get(
          `/users/${previousAppointment.doctorId}`,
        );
        if (response.data?.success && response.data?.data?.isActive) {
          return {
            doctorId: previousAppointment.doctorId,
            doctorName: previousAppointment.doctorName,
          };
        }
      } catch {
        // Clinician no longer available, continue to next step
      }
    }

    // Step 2: Fetch all active clinicians from user-service
    let availableClinicians: any[] = [];
    try {
      const response = await this.httpService.axiosRef.get('/users', {
        params: {
          role: 'doctor,consultant,nurse,hospital_pharmacist,prescriber',
          isActive: true,
          limit: 200,
        },
      });
      if (response.data?.success && response.data?.data) {
        availableClinicians = response.data.data;
      }
    } catch (error) {
      this.logger.error('Failed to fetch clinicians from user-service', error);
      return null;
    }

    if (availableClinicians.length === 0) {
      return null;
    }

    // Step 3: If we have a scheduled date, count appointments for each clinician on that date
    if (scheduledDate && availableClinicians.length > 0) {
      const dateStart = new Date(scheduledDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(scheduledDate);
      dateEnd.setHours(23, 59, 59, 999);

      // Get appointment counts for all clinicians on the requested date
      const clinicianAppointmentCounts = new Map<string, number>();

      for (const clinician of availableClinicians) {
        const count = await this.appointmentRepository.count({
          where: {
            doctorId: clinician.id,
            scheduledDate: dateStart, // TypeORM will handle the date range
            status: { $nin: ['cancelled', 'rescheduled'] } as any,
            hospitalId,
            ...(departmentId && { departmentId }),
          },
        });
        clinicianAppointmentCounts.set(clinician.id, count);
      }

      // Sort clinicians by appointment count (ascending) - assign to least busy
      const sortedClinicians = [...availableClinicians].sort((a, b) => {
        const countA = clinicianAppointmentCounts.get(a.id) || 0;
        const countB = clinicianAppointmentCounts.get(b.id) || 0;
        return countA - countB;
      });

      const assigned = sortedClinicians[0];
      return {
        doctorId: assigned.id,
        doctorName: `${assigned.firstName} ${assigned.lastName}`,
      };
    }

    // Step 4: No scheduled date provided, just pick first available clinician
    const assigned = availableClinicians[0];
    return {
      doctorId: assigned.id,
      doctorName: `${assigned.firstName} ${assigned.lastName}`,
    };
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
      action: 'UPDATE',
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
      action: 'UPDATE',
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
      action: 'DELETE',
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
      action: 'UPDATE',
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
      action: 'UPDATE',
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
      doctorName: 'Referred Doctor', // Will be updated by frontend
      hospitalId: originalAppointment.hospitalId,
      departmentId: originalAppointment.departmentId,
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

  // ==================== Queue-Based Workflow ====================

  /**
   * Assign clinician to appointment (manual assignment by admin)
   */
  async assignClinician(
    appointmentId: string,
    clinicianId: string,
    adminId?: string,
  ): Promise<AppointmentEntity> {
    const appointment = await this.findOne(appointmentId);

    // Get clinician info from user-service
    const clinicianName = await this.assignmentService.getClinicianName(clinicianId);

    appointment.doctorId = clinicianId;
    appointment.doctorName = clinicianName;
    appointment.assignmentStatus = 'assigned';
    appointment.assignedAt = new Date();
    appointment.autoAssigned = false;

    const saved = await this.appointmentRepository.save(appointment);

    // Remove from queue
    await this.queueService.removeFromQueue(appointmentId);

    // Publish events
    this.eventPublisher.publishAuditLog({
      userId: adminId,
      action: 'UPDATE',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
      details: `Manually assigned to clinician ${clinicianName} (${clinicianId}). Patient: ${appointment.patientName}`,
    });

    this.logger.log(`Appointment ${appointmentId} assigned to clinician ${clinicianId}`);

    return saved;
  }

  /**
   * Clinician accepts assigned appointment
   */
  async acceptAppointment(appointmentId: string, clinicianId: string): Promise<AppointmentEntity> {
    const appointment = await this.findOne(appointmentId);

    // Verify clinician is assigned to this appointment
    if (appointment.doctorId !== clinicianId) {
      throw new ForbiddenException('You are not assigned to this appointment');
    }

    if (appointment.assignmentStatus !== 'assigned') {
      throw new BadRequestException(
        `Appointment cannot be accepted in current state: ${appointment.assignmentStatus}`,
      );
    }

    appointment.assignmentStatus = 'accepted';
    appointment.acceptedAt = new Date();
    appointment.status = 'confirmed';

    const saved = await this.appointmentRepository.save(appointment);

    this.eventPublisher.publishAuditLog({
      userId: clinicianId,
      action: 'UPDATE',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
      details: `Appointment accepted by ${appointment.doctorName}. Patient: ${appointment.patientName}, Scheduled: ${appointment.scheduledDate}`,
    });

    this.logger.log(`Appointment ${appointmentId} accepted by clinician ${clinicianId}`);

    return saved;
  }

  /**
   * Clinician rejects assigned appointment (returns to queue)
   */
  async rejectAppointment(
    appointmentId: string,
    clinicianId: string,
    reason: string,
  ): Promise<AppointmentEntity> {
    const appointment = await this.findOne(appointmentId);

    // Verify clinician is assigned to this appointment
    if (appointment.doctorId !== clinicianId) {
      throw new ForbiddenException('You are not assigned to this appointment');
    }

    appointment.assignmentStatus = 'rejected';
    appointment.rejectedAt = new Date();
    appointment.rejectionReason = reason;

    // Clear assignment
    appointment.doctorId = null;
    appointment.doctorName = null;

    const saved = await this.appointmentRepository.save(appointment);

    this.eventPublisher.publishAuditLog({
      userId: clinicianId,
      action: 'UPDATE',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
      details: `Appointment rejected and returned to queue. Patient: ${appointment.patientName}, Reason: ${reason}`,
    });

    // Add back to queue
    await this.queueService.addToQueue(
      appointment.id,
      appointment.hospitalId,
      appointment.departmentId,
    );

    this.logger.log(`Appointment ${appointmentId} rejected by clinician ${clinicianId}, returned to queue`);

    // Auto-reassign using workload strategy
    const assigned = await this.assignmentService.autoAssignClinician(appointmentId, 'workload');
    if (assigned) {
      await this.assignClinician(appointmentId, assigned.clinicianId);
      this.logger.log(`Rejected appointment ${appointmentId} auto-reassigned to ${assigned.clinicianId}`);
    }

    return this.findOne(appointmentId);
  }

  /**
   * Clinician refers appointment to another clinician
   */
  async referAppointment(
    appointmentId: string,
    clinicianId: string,
    referToClinicianId: string,
    notes?: string,
  ): Promise<AppointmentEntity> {
    const appointment = await this.findOne(appointmentId);

    // Verify clinician is assigned to this appointment
    if (appointment.doctorId !== clinicianId) {
      throw new ForbiddenException('You are not assigned to this appointment');
    }

    // Get referred clinician info
    const referredClinicianName = await this.assignmentService.getClinicianName(referToClinicianId);

    // Store referral information
    appointment.referredById = clinicianId;
    appointment.referredToDoctorId = referToClinicianId;
    appointment.referredToDoctorName = referredClinicianName;
    appointment.referredAt = new Date();
    appointment.referralNotes = notes || null;

    // Update assignment
    appointment.doctorId = referToClinicianId;
    appointment.doctorName = referredClinicianName;
    appointment.assignmentStatus = 'assigned'; // New clinician needs to accept
    appointment.assignedAt = new Date();

    const saved = await this.appointmentRepository.save(appointment);

    this.eventPublisher.publishAuditLog({
      userId: clinicianId,
      action: 'UPDATE',
      resource: 'appointment',
      resourceId: saved.id,
      status: 'success',
      details: `Appointment referred from ${appointment.referredById} to ${referredClinicianName} (${referToClinicianId}). Patient: ${appointment.patientName}${notes ? `, Notes: ${notes}` : ''}`,
    });

    this.logger.log(`Appointment ${appointmentId} referred from ${clinicianId} to ${referToClinicianId}`);

    return saved;
  }

  /**
   * Get appointments assigned to specific clinician
   */
  async getMyAppointments(
    clinicianId: string,
    filters?: Partial<AppointmentFilterDto>,
  ): Promise<AppointmentEntity[]> {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctorId = :clinicianId', { clinicianId })
      .andWhere('appointment.assignmentStatus IN (:...statuses)', {
        statuses: ['assigned', 'accepted'],
      });

    // Apply filters
    if (filters?.status) {
      queryBuilder.andWhere('appointment.status = :status', { status: filters.status });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('appointment.scheduledDate >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('appointment.scheduledDate <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters?.appointmentType) {
      queryBuilder.andWhere('appointment.appointmentType = :appointmentType', {
        appointmentType: filters.appointmentType,
      });
    }

    return queryBuilder
      .orderBy('appointment.scheduledDate', 'ASC')
      .addOrderBy('appointment.createdAt', 'DESC')
      .getMany();
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
