import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncounterEntity } from './entities/encounter.entity';
import { ClinicalNoteEntity } from './entities/clinical-note.entity';
import {
  CreateEncounterDto,
  UpdateEncounterDto,
  CreateClinicalNoteDto,
  EncounterFilterDto,
} from './dto';
import { ClinicalEventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class EncountersService {
  constructor(
    @InjectRepository(EncounterEntity)
    private readonly encounterRepository: Repository<EncounterEntity>,
    @InjectRepository(ClinicalNoteEntity)
    private readonly clinicalNoteRepository: Repository<ClinicalNoteEntity>,
    private readonly eventPublisher: ClinicalEventPublisherService,
  ) {}

  // ==================== Encounter CRUD ====================

  async create(dto: CreateEncounterDto, userId?: string): Promise<EncounterEntity> {
    const encounter = this.encounterRepository.create({
      ...dto,
      createdBy: userId,
    });

    const saved = await this.encounterRepository.save(encounter);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'encounter.created',
      resource: 'encounter',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findAll(filterDto: EncounterFilterDto): Promise<{
    data: EncounterEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { patientId, doctorId, status, encounterType, dateFrom, dateTo } = filterDto;
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 10;
    const sortBy = filterDto.sortBy ?? 'createdAt';
    const sortOrder = filterDto.sortOrder ?? 'DESC';

    const queryBuilder = this.encounterRepository.createQueryBuilder('encounter');

    if (patientId) {
      queryBuilder.andWhere('encounter.patientId = :patientId', { patientId });
    }

    if (doctorId) {
      queryBuilder.andWhere(
        '(encounter.admittingDoctorId = :doctorId OR encounter.attendingDoctorId = :doctorId)',
        { doctorId },
      );
    }

    if (status) {
      queryBuilder.andWhere('encounter.status = :status', { status });
    }

    if (encounterType) {
      queryBuilder.andWhere('encounter.encounterType = :encounterType', { encounterType });
    }

    if (dateFrom) {
      queryBuilder.andWhere('encounter.admissionDate >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('encounter.admissionDate <= :dateTo', { dateTo });
    }

    const validSortFields = ['createdAt', 'admissionDate', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    queryBuilder.orderBy(`encounter.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<EncounterEntity> {
    const encounter = await this.encounterRepository.findOne({
      where: { id },
      relations: ['clinicalNotes', 'dischargeForm'],
    });

    if (!encounter) {
      throw new NotFoundException(`Encounter with ID ${id} not found`);
    }

    return encounter;
  }

  async update(id: string, dto: UpdateEncounterDto, userId?: string): Promise<EncounterEntity> {
    const encounter = await this.findOne(id);

    Object.assign(encounter, dto);

    const saved = await this.encounterRepository.save(encounter);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'encounter.updated',
      resource: 'encounter',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findByPatient(patientId: string): Promise<EncounterEntity[]> {
    return this.encounterRepository.find({
      where: { patientId },
      relations: ['clinicalNotes'],
      order: { admissionDate: 'DESC' },
    });
  }

  async findByDoctor(doctorId: string, status?: string): Promise<EncounterEntity[]> {
    const queryBuilder = this.encounterRepository.createQueryBuilder('encounter');

    queryBuilder.andWhere(
      '(encounter.admittingDoctorId = :doctorId OR encounter.attendingDoctorId = :doctorId)',
      { doctorId },
    );

    if (status) {
      queryBuilder.andWhere('encounter.status = :status', { status });
    }

    queryBuilder.orderBy('encounter.admissionDate', 'DESC');

    return queryBuilder.getMany();
  }

  // ==================== Clinical Notes ====================

  async addClinicalNote(
    encounterId: string,
    dto: CreateClinicalNoteDto,
    userId?: string,
  ): Promise<ClinicalNoteEntity> {
    const encounter = await this.findOne(encounterId);

    const note = this.clinicalNoteRepository.create({
      ...dto,
      encounterId,
      patientId: encounter.patientId,
      authorId: userId,
    });

    const saved = await this.clinicalNoteRepository.save(note);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'clinical_note.created',
      resource: 'clinical_note',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async getClinicalNotes(encounterId: string): Promise<ClinicalNoteEntity[]> {
    await this.findOne(encounterId);

    return this.clinicalNoteRepository.find({
      where: { encounterId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ==================== Bed Assignment ====================

  async assignBed(
    id: string,
    wardId: string,
    bedId: string,
    userId?: string,
  ): Promise<EncounterEntity> {
    const encounter = await this.findOne(id);

    if (encounter.status === 'discharged' || encounter.status === 'deceased') {
      throw new BadRequestException(
        `Cannot assign bed to encounter with status '${encounter.status}'`,
      );
    }

    encounter.wardId = wardId;
    encounter.bedId = bedId;

    const saved = await this.encounterRepository.save(encounter);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'encounter.bed_assigned',
      resource: 'encounter',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  // ==================== Ward Queries ====================

  async findByWard(wardId: string): Promise<EncounterEntity[]> {
    return this.encounterRepository
      .createQueryBuilder('encounter')
      .where('encounter.wardId = :wardId', { wardId })
      .andWhere('encounter.status NOT IN (:...statuses)', {
        statuses: ['discharged', 'deceased', 'transferred'],
      })
      .orderBy('encounter.admissionDate', 'DESC')
      .getMany();
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats(userId?: string, role?: string): Promise<Record<string, unknown>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (role === 'doctor' || role === 'consultant') {
      const activeEncounters = await this.encounterRepository
        .createQueryBuilder('encounter')
        .where(
          '(encounter.admittingDoctorId = :userId OR encounter.attendingDoctorId = :userId)',
          { userId },
        )
        .andWhere('encounter.status NOT IN (:...statuses)', {
          statuses: ['discharged', 'deceased'],
        })
        .getCount();

      const pendingDischarges = await this.encounterRepository
        .createQueryBuilder('encounter')
        .where(
          '(encounter.admittingDoctorId = :userId OR encounter.attendingDoctorId = :userId)',
          { userId },
        )
        .andWhere('encounter.status = :status', { status: 'awaiting_discharge' })
        .getCount();

      const notesToday = await this.clinicalNoteRepository
        .createQueryBuilder('note')
        .where('note.authorId = :userId', { userId })
        .andWhere('note.createdAt >= :today', { today: today.toISOString() })
        .andWhere('note.createdAt < :tomorrow', { tomorrow: tomorrow.toISOString() })
        .getCount();

      return {
        activeEncounters,
        pendingDischarges,
        notesToday,
      };
    }

    if (role === 'nurse') {
      const patientsInWard = await this.encounterRepository
        .createQueryBuilder('encounter')
        .where('encounter.status IN (:...statuses)', {
          statuses: ['admitted', 'in_treatment'],
        })
        .andWhere('encounter.wardId IS NOT NULL')
        .getCount();

      const pendingAssessments = await this.encounterRepository
        .createQueryBuilder('encounter')
        .where('encounter.status = :status', { status: 'admitted' })
        .getCount();

      return {
        patientsInWard,
        pendingAssessments,
      };
    }

    if (role === 'hospital_pharmacist' || role === 'pharmacy_technician') {
      const pendingPharmacyReviews = await this.encounterRepository
        .createQueryBuilder('encounter')
        .where('encounter.status = :status', { status: 'awaiting_discharge' })
        .getCount();

      return {
        pendingPharmacyReviews,
      };
    }

    // Admin / default
    const totalEncounters = await this.encounterRepository.count();

    const admissionsToday = await this.encounterRepository
      .createQueryBuilder('encounter')
      .where('encounter.admissionDate >= :today', { today: today.toISOString() })
      .andWhere('encounter.admissionDate < :tomorrow', { tomorrow: tomorrow.toISOString() })
      .getCount();

    const dischargesToday = await this.encounterRepository
      .createQueryBuilder('encounter')
      .where('encounter.dischargeDate >= :today', { today: today.toISOString() })
      .andWhere('encounter.dischargeDate < :tomorrow', { tomorrow: tomorrow.toISOString() })
      .getCount();

    const activeEncounters = await this.encounterRepository
      .createQueryBuilder('encounter')
      .where('encounter.status NOT IN (:...statuses)', {
        statuses: ['discharged', 'deceased'],
      })
      .getCount();

    return {
      totalEncounters,
      activeEncounters,
      admissionsToday,
      dischargesToday,
    };
  }
}
