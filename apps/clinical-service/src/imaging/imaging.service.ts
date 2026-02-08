import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImagingRequestEntity } from './entities/imaging-request.entity';
import {
  CreateImagingRequestDto,
  UpdateImagingRequestDto,
  ImagingFilterDto,
} from './dto';
import { ClinicalEventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class ImagingService {
  constructor(
    @InjectRepository(ImagingRequestEntity)
    private readonly imagingRequestRepository: Repository<ImagingRequestEntity>,
    private readonly eventPublisher: ClinicalEventPublisherService,
  ) {}

  // ==================== Imaging Request CRUD ====================

  async create(dto: CreateImagingRequestDto, userId?: string): Promise<ImagingRequestEntity> {
    const request = this.imagingRequestRepository.create({
      ...dto,
      requestedById: userId,
      requestedAt: new Date(),
    });

    const saved = await this.imagingRequestRepository.save(request);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'CREATE',
      resource: 'imaging_request',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findAll(filterDto: ImagingFilterDto): Promise<{
    data: ImagingRequestEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { patientId, status, type, dateFrom, dateTo } = filterDto;
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 10;
    const sortBy = filterDto.sortBy ?? 'requestedAt';
    const sortOrder = filterDto.sortOrder ?? 'DESC';

    const queryBuilder = this.imagingRequestRepository.createQueryBuilder('imaging');

    if (patientId) {
      queryBuilder.andWhere('imaging.patientId = :patientId', { patientId });
    }

    if (status) {
      queryBuilder.andWhere('imaging.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('imaging.imagingType = :type', { type });
    }

    if (dateFrom) {
      queryBuilder.andWhere('imaging.requestedAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('imaging.requestedAt <= :dateTo', { dateTo });
    }

    const validSortFields = ['requestedAt', 'createdAt', 'status', 'urgency'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'requestedAt';

    queryBuilder.orderBy(`imaging.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<ImagingRequestEntity> {
    const request = await this.imagingRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Imaging request with ID ${id} not found`);
    }

    return request;
  }

  async update(id: string, dto: UpdateImagingRequestDto): Promise<ImagingRequestEntity> {
    const request = await this.findOne(id);

    Object.assign(request, dto);

    const saved = await this.imagingRequestRepository.save(request);

    this.eventPublisher.publishAuditLog({
      action: 'UPDATE',
      resource: 'imaging_request',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findByPatient(patientId: string): Promise<ImagingRequestEntity[]> {
    return this.imagingRequestRepository.find({
      where: { patientId },
      order: { requestedAt: 'DESC' },
    });
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats(): Promise<Record<string, unknown>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pendingRequests = await this.imagingRequestRepository.count({
      where: { status: 'requested' as const },
    });

    const scheduledToday = await this.imagingRequestRepository
      .createQueryBuilder('imaging')
      .where('imaging.scheduledDate >= :today', { today: today.toISOString() })
      .andWhere('imaging.scheduledDate < :tomorrow', { tomorrow: tomorrow.toISOString() })
      .andWhere('imaging.status = :status', { status: 'scheduled' })
      .getCount();

    const completedToday = await this.imagingRequestRepository
      .createQueryBuilder('imaging')
      .where('imaging.completedDate >= :today', { today: today.toISOString() })
      .andWhere('imaging.completedDate < :tomorrow', { tomorrow: tomorrow.toISOString() })
      .getCount();

    const urgentPending = await this.imagingRequestRepository
      .createQueryBuilder('imaging')
      .where('imaging.urgency IN (:...urgencies)', { urgencies: ['stat', 'urgent'] })
      .andWhere('imaging.status IN (:...statuses)', { statuses: ['requested', 'scheduled'] })
      .getCount();

    return {
      pendingRequests,
      scheduledToday,
      completedToday,
      urgentPending,
    };
  }
}
