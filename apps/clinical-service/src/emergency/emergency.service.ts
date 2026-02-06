import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyVisitEntity } from './entities/emergency-visit.entity';
import {
  CreateEmergencyVisitDto,
  UpdateEmergencyVisitDto,
  EmergencyFilterDto,
  DisposeEmergencyVisitDto,
} from './dto';
import { ClinicalEventPublisherService } from '../events/event-publisher.service';
import { EncountersService } from '../encounters/encounters.service';

@Injectable()
export class EmergencyService {
  constructor(
    @InjectRepository(EmergencyVisitEntity)
    private readonly emergencyVisitRepository: Repository<EmergencyVisitEntity>,
    private readonly eventPublisher: ClinicalEventPublisherService,
    private readonly encountersService: EncountersService,
  ) {}

  // ==================== Emergency Visit CRUD ====================

  async create(dto: CreateEmergencyVisitDto): Promise<EmergencyVisitEntity> {
    const visit = this.emergencyVisitRepository.create(dto);

    const saved = await this.emergencyVisitRepository.save(visit);

    this.eventPublisher.publishAuditLog({
      action: 'emergency_visit.created',
      resource: 'emergency_visit',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findAll(filterDto: EmergencyFilterDto): Promise<{
    data: EmergencyVisitEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { status, triageLevel, dateFrom, dateTo } = filterDto;
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 10;
    const sortBy = filterDto.sortBy ?? 'arrivalTime';
    const sortOrder = filterDto.sortOrder ?? 'DESC';

    const queryBuilder = this.emergencyVisitRepository.createQueryBuilder('visit');

    if (status) {
      queryBuilder.andWhere('visit.status = :status', { status });
    }

    if (triageLevel) {
      queryBuilder.andWhere('visit.triageLevel = :triageLevel', { triageLevel });
    }

    if (dateFrom) {
      queryBuilder.andWhere('visit.arrivalTime >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('visit.arrivalTime <= :dateTo', { dateTo });
    }

    const validSortFields = ['arrivalTime', 'createdAt', 'triageLevel', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'arrivalTime';

    queryBuilder.orderBy(`visit.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<EmergencyVisitEntity> {
    const visit = await this.emergencyVisitRepository.findOne({
      where: { id },
    });

    if (!visit) {
      throw new NotFoundException(`Emergency visit with ID ${id} not found`);
    }

    return visit;
  }

  async update(id: string, dto: UpdateEmergencyVisitDto): Promise<EmergencyVisitEntity> {
    const visit = await this.findOne(id);

    Object.assign(visit, dto);

    const saved = await this.emergencyVisitRepository.save(visit);

    this.eventPublisher.publishAuditLog({
      action: 'emergency_visit.updated',
      resource: 'emergency_visit',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async dispose(
    id: string,
    dto: DisposeEmergencyVisitDto,
    userId?: string,
  ): Promise<{ visit: EmergencyVisitEntity; encounter?: any }> {
    const visit = await this.findOne(id);

    if (visit.status !== 'being_seen') {
      throw new BadRequestException('Only visits being seen can be disposed');
    }

    visit.disposition = dto.disposition as any;
    visit.dispositionTime = new Date();

    if (dto.notes) {
      visit.notes = visit.notes ? `${visit.notes}\n${dto.notes}` : dto.notes;
    }

    let encounter: any;

    switch (dto.disposition) {
      case 'admitted': {
        if (!dto.hospitalId) {
          throw new BadRequestException(
            'hospitalId is required when disposition is admitted',
          );
        }

        encounter = await this.encountersService.create(
          {
            patientId: visit.patientId,
            patientChi: visit.patientChi,
            hospitalId: dto.hospitalId,
            departmentId: dto.departmentId,
            wardId: dto.wardId,
            bedId: dto.bedId,
            encounterType: 'emergency',
            admissionDate: new Date(),
            admittingDoctorId: dto.admittingDoctorId || visit.attendingDoctorId,
            chiefComplaint: visit.chiefComplaint,
            admissionDiagnosis: dto.admissionDiagnosis,
          } as any,
          userId,
        );

        visit.encounterId = encounter.id;
        visit.status = 'admitted';
        break;
      }
      case 'discharged_home': {
        visit.status = 'discharged';
        break;
      }
      case 'transferred': {
        visit.status = 'transferred';
        break;
      }
      case 'deceased': {
        visit.status = 'discharged';
        break;
      }
      case 'left_ama': {
        visit.status = 'discharged';
        break;
      }
    }

    const saved = await this.emergencyVisitRepository.save(visit);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'emergency_visit.disposed',
      resource: 'emergency_visit',
      resourceId: saved.id,
      status: 'success',
    });

    return { visit: saved, encounter };
  }

  async findActive(): Promise<EmergencyVisitEntity[]> {
    return this.emergencyVisitRepository.find({
      where: [
        { status: 'waiting' as const },
        { status: 'triaged' as const },
        { status: 'being_seen' as const },
      ],
      order: { arrivalTime: 'ASC' },
    });
  }

  async findByPatient(patientId: string): Promise<EmergencyVisitEntity[]> {
    return this.emergencyVisitRepository.find({
      where: { patientId },
      order: { arrivalTime: 'DESC' },
    });
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats(): Promise<Record<string, unknown>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Waiting count by triage level
    const waitingByTriageLevel = await this.emergencyVisitRepository
      .createQueryBuilder('visit')
      .select('visit.triage_level', 'triageLevel')
      .addSelect('COUNT(*)', 'count')
      .where('visit.status IN (:...statuses)', {
        statuses: ['waiting', 'triaged'],
      })
      .groupBy('visit.triage_level')
      .getRawMany();

    // Average wait times (for visits that have moved from waiting)
    const avgWaitTimes = await this.emergencyVisitRepository
      .createQueryBuilder('visit')
      .select('visit.triage_level', 'triageLevel')
      .addSelect(
        'AVG(EXTRACT(EPOCH FROM (visit.updated_at - visit.arrival_time)) / 60)',
        'avgWaitMinutes',
      )
      .where('visit.status NOT IN (:...statuses)', {
        statuses: ['waiting'],
      })
      .andWhere('visit.arrivalTime >= :today', { today: today.toISOString() })
      .andWhere('visit.arrivalTime < :tomorrow', { tomorrow: tomorrow.toISOString() })
      .groupBy('visit.triage_level')
      .getRawMany();

    // Today counts
    const todayTotal = await this.emergencyVisitRepository
      .createQueryBuilder('visit')
      .where('visit.arrivalTime >= :today', { today: today.toISOString() })
      .andWhere('visit.arrivalTime < :tomorrow', { tomorrow: tomorrow.toISOString() })
      .getCount();

    const currentlyWaiting = await this.emergencyVisitRepository
      .createQueryBuilder('visit')
      .where('visit.status IN (:...statuses)', {
        statuses: ['waiting', 'triaged'],
      })
      .getCount();

    const currentlyBeingSeen = await this.emergencyVisitRepository
      .createQueryBuilder('visit')
      .where('visit.status = :status', { status: 'being_seen' })
      .getCount();

    return {
      waitingByTriageLevel,
      avgWaitTimes,
      todayTotal,
      currentlyWaiting,
      currentlyBeingSeen,
    };
  }
}
