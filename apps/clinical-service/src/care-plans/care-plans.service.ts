import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarePlanEntity } from './entities/care-plan.entity';
import {
  CreateCarePlanDto,
  UpdateCarePlanDto,
  CarePlanFilterDto,
} from './dto';
import { ClinicalEventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class CarePlansService {
  constructor(
    @InjectRepository(CarePlanEntity)
    private readonly carePlanRepository: Repository<CarePlanEntity>,
    private readonly eventPublisher: ClinicalEventPublisherService,
  ) {}

  // ==================== Care Plan CRUD ====================

  async create(dto: CreateCarePlanDto, userId?: string): Promise<CarePlanEntity> {
    const carePlan = this.carePlanRepository.create({
      ...dto,
      createdById: userId,
    });

    const saved = await this.carePlanRepository.save(carePlan);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'CREATE',
      resource: 'care_plan',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findAll(filterDto: CarePlanFilterDto): Promise<{
    data: CarePlanEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { patientId, status } = filterDto;
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 10;
    const sortBy = filterDto.sortBy ?? 'createdAt';
    const sortOrder = filterDto.sortOrder ?? 'DESC';

    const queryBuilder = this.carePlanRepository.createQueryBuilder('carePlan');

    if (patientId) {
      queryBuilder.andWhere('carePlan.patientId = :patientId', { patientId });
    }

    if (status) {
      queryBuilder.andWhere('carePlan.status = :status', { status });
    }

    const validSortFields = ['createdAt', 'reviewDate', 'status', 'priority'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    queryBuilder.orderBy(`carePlan.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<CarePlanEntity> {
    const carePlan = await this.carePlanRepository.findOne({
      where: { id },
    });

    if (!carePlan) {
      throw new NotFoundException(`Care plan with ID ${id} not found`);
    }

    return carePlan;
  }

  async update(id: string, dto: UpdateCarePlanDto): Promise<CarePlanEntity> {
    const carePlan = await this.findOne(id);

    Object.assign(carePlan, dto);

    const saved = await this.carePlanRepository.save(carePlan);

    this.eventPublisher.publishAuditLog({
      action: 'UPDATE',
      resource: 'care_plan',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findByPatient(patientId: string): Promise<CarePlanEntity[]> {
    return this.carePlanRepository.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<CarePlanEntity[]> {
    return this.carePlanRepository.find({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats(): Promise<Record<string, unknown>> {
    const activePlans = await this.carePlanRepository.count({
      where: { status: 'active' },
    });

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const reviewsDueThisWeek = await this.carePlanRepository
      .createQueryBuilder('carePlan')
      .where('carePlan.status = :status', { status: 'active' })
      .andWhere('carePlan.reviewDate >= :today', { today: today.toISOString().split('T')[0] })
      .andWhere('carePlan.reviewDate <= :nextWeek', { nextWeek: nextWeek.toISOString().split('T')[0] })
      .getCount();

    const overdueReviews = await this.carePlanRepository
      .createQueryBuilder('carePlan')
      .where('carePlan.status = :status', { status: 'active' })
      .andWhere('carePlan.reviewDate < :today', { today: today.toISOString().split('T')[0] })
      .getCount();

    const completedThisMonth = await this.carePlanRepository
      .createQueryBuilder('carePlan')
      .where('carePlan.status = :status', { status: 'completed' })
      .andWhere('carePlan.updatedAt >= :monthStart', {
        monthStart: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
      })
      .getCount();

    return {
      activePlans,
      reviewsDueThisWeek,
      overdueReviews,
      completedThisMonth,
    };
  }
}
