import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ControlledDrugEntryEntity } from './entities/controlled-drug-entry.entity';
import {
  CreateControlledDrugEntryDto,
  ControlledDrugFilterDto,
} from './dto';
import { ClinicalEventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class ControlledDrugsService {
  constructor(
    @InjectRepository(ControlledDrugEntryEntity)
    private readonly controlledDrugEntryRepository: Repository<ControlledDrugEntryEntity>,
    private readonly eventPublisher: ClinicalEventPublisherService,
  ) {}

  // ==================== Controlled Drug Entry CRUD ====================

  async create(dto: CreateControlledDrugEntryDto, userId?: string): Promise<ControlledDrugEntryEntity> {
    const entry = this.controlledDrugEntryRepository.create({
      ...dto,
      administeredById: userId,
    });

    const saved = await this.controlledDrugEntryRepository.save(entry);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'CREATE',
      resource: 'controlled_drug_entry',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findAll(filterDto: ControlledDrugFilterDto): Promise<{
    data: ControlledDrugEntryEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { drugName, patientId, entryType, dateFrom, dateTo } = filterDto;
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 10;
    const sortBy = filterDto.sortBy ?? 'administeredAt';
    const sortOrder = filterDto.sortOrder ?? 'DESC';

    const queryBuilder = this.controlledDrugEntryRepository.createQueryBuilder('entry');

    if (drugName) {
      queryBuilder.andWhere('entry.drugName ILIKE :drugName', { drugName: `%${drugName}%` });
    }

    if (patientId) {
      queryBuilder.andWhere('entry.patientId = :patientId', { patientId });
    }

    if (entryType) {
      queryBuilder.andWhere('entry.entryType = :entryType', { entryType });
    }

    if (dateFrom) {
      queryBuilder.andWhere('entry.administeredAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('entry.administeredAt <= :dateTo', { dateTo });
    }

    const validSortFields = ['administeredAt', 'createdAt', 'drugName'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'administeredAt';

    queryBuilder.orderBy(`entry.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<ControlledDrugEntryEntity> {
    const entry = await this.controlledDrugEntryRepository.findOne({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(`Controlled drug entry with ID ${id} not found`);
    }

    return entry;
  }

  async findByPatient(patientId: string): Promise<ControlledDrugEntryEntity[]> {
    return this.controlledDrugEntryRepository.find({
      where: { patientId },
      order: { administeredAt: 'DESC' },
    });
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats(): Promise<Record<string, unknown>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalEntriesToday = await this.controlledDrugEntryRepository
      .createQueryBuilder('entry')
      .where('entry.administeredAt >= :today', { today: today.toISOString() })
      .andWhere('entry.administeredAt < :tomorrow', { tomorrow: tomorrow.toISOString() })
      .getCount();

    const bySchedule = await this.controlledDrugEntryRepository
      .createQueryBuilder('entry')
      .select('entry.drug_schedule', 'schedule')
      .addSelect('COUNT(*)', 'count')
      .where('entry.administeredAt >= :today', { today: today.toISOString() })
      .andWhere('entry.administeredAt < :tomorrow', { tomorrow: tomorrow.toISOString() })
      .groupBy('entry.drug_schedule')
      .getRawMany();

    const topDrugs = await this.controlledDrugEntryRepository
      .createQueryBuilder('entry')
      .select('entry.drug_name', 'drugName')
      .addSelect('COUNT(*)', 'count')
      .where('entry.administeredAt >= :today', { today: today.toISOString() })
      .andWhere('entry.administeredAt < :tomorrow', { tomorrow: tomorrow.toISOString() })
      .groupBy('entry.drug_name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalEntriesToday,
      bySchedule,
      topDrugs,
    };
  }
}
