import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HospitalEntity,
  DepartmentEntity,
  WardEntity,
  BedEntity,
} from './entities';
import {
  CreateHospitalDto,
  UpdateHospitalDto,
  HospitalFilterDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateWardDto,
  UpdateWardDto,
  CreateBedDto,
  UpdateBedDto,
} from './dto';
import { EventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class HospitalsService {
  private readonly logger = new Logger(HospitalsService.name);

  constructor(
    @InjectRepository(HospitalEntity)
    private readonly hospitalRepository: Repository<HospitalEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
    @InjectRepository(WardEntity)
    private readonly wardRepository: Repository<WardEntity>,
    @InjectRepository(BedEntity)
    private readonly bedRepository: Repository<BedEntity>,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  // ==================== Hospital CRUD ====================

  async createHospital(
    createHospitalDto: CreateHospitalDto,
    userId?: string,
  ): Promise<HospitalEntity> {
    const existingHospital = await this.hospitalRepository.findOne({
      where: { name: createHospitalDto.name },
    });

    if (existingHospital) {
      throw new ConflictException('Hospital with this name already exists');
    }

    const hospital = this.hospitalRepository.create({
      ...createHospitalDto,
      createdBy: userId,
    });

    const saved = await this.hospitalRepository.save(hospital);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'CREATE',
      resource: 'hospital',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findAllHospitals(filterDto: HospitalFilterDto): Promise<{
    data: HospitalEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, isActive } = filterDto;
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 10;

    const queryBuilder = this.hospitalRepository.createQueryBuilder('hospital');

    if (search) {
      queryBuilder.andWhere(
        '(hospital.name ILIKE :search OR hospital.city ILIKE :search OR hospital.province ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('hospital.isActive = :isActive', { isActive });
    }

    queryBuilder.orderBy('hospital.name', 'ASC');

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

  async findOneHospital(id: string): Promise<HospitalEntity> {
    const hospital = await this.hospitalRepository.findOne({
      where: { id },
      relations: ['departments'],
    });

    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }

    return hospital;
  }

  async updateHospital(
    id: string,
    updateHospitalDto: UpdateHospitalDto,
  ): Promise<HospitalEntity> {
    const hospital = await this.findOneHospital(id);

    if (updateHospitalDto.name && updateHospitalDto.name !== hospital.name) {
      const existingHospital = await this.hospitalRepository.findOne({
        where: { name: updateHospitalDto.name },
      });

      if (existingHospital) {
        throw new ConflictException('Hospital with this name already exists');
      }
    }

    // Track changes for event
    const changes: Record<string, { old: any; new: any }> = {};
    for (const [key, newValue] of Object.entries(updateHospitalDto)) {
      if (newValue !== undefined && (hospital as any)[key] !== newValue) {
        changes[key] = { old: (hospital as any)[key], new: newValue };
      }
    }

    Object.assign(hospital, updateHospitalDto);

    const saved = await this.hospitalRepository.save(hospital);

    if (Object.keys(changes).length > 0) {
      this.eventPublisher.publishHospitalUpdated({
        hospitalId: saved.id,
        name: saved.name,
        changes,
      });
    }

    this.eventPublisher.publishAuditLog({
      action: 'UPDATE',
      resource: 'hospital',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  // ==================== Department CRUD ====================

  async createDepartment(
    dto: CreateDepartmentDto,
    userId?: string,
  ): Promise<DepartmentEntity> {
    const hospital = await this.hospitalRepository.findOne({
      where: { id: dto.hospitalId },
    });

    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${dto.hospitalId} not found`);
    }

    const existingDepartment = await this.departmentRepository.findOne({
      where: { hospitalId: dto.hospitalId, name: dto.name },
    });

    if (existingDepartment) {
      throw new ConflictException(
        `Department "${dto.name}" already exists in this hospital`,
      );
    }

    const department = this.departmentRepository.create(dto);

    const saved = await this.departmentRepository.save(department);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'CREATE',
      resource: 'department',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findDepartmentsByHospital(hospitalId: string): Promise<DepartmentEntity[]> {
    const hospital = await this.hospitalRepository.findOne({
      where: { id: hospitalId },
    });

    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
    }

    const departments = await this.departmentRepository
      .createQueryBuilder('department')
      .where('department.hospitalId = :hospitalId', { hospitalId })
      .loadRelationCountAndMap('department.wardCount', 'department.wards')
      .orderBy('department.name', 'ASC')
      .getMany();

    return departments;
  }

  async updateDepartment(
    id: string,
    dto: UpdateDepartmentDto,
  ): Promise<DepartmentEntity> {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    if (dto.name && dto.name !== department.name) {
      const existingDepartment = await this.departmentRepository.findOne({
        where: { hospitalId: department.hospitalId, name: dto.name },
      });

      if (existingDepartment) {
        throw new ConflictException(
          `Department "${dto.name}" already exists in this hospital`,
        );
      }
    }

    Object.assign(department, dto);

    const saved = await this.departmentRepository.save(department);

    this.eventPublisher.publishDepartmentUpdated({
      departmentId: saved.id,
      hospitalId: saved.hospitalId,
      name: saved.name,
      changes: {},
    });

    this.eventPublisher.publishAuditLog({
      action: 'UPDATE',
      resource: 'department',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  // ==================== Ward CRUD ====================

  async createWard(
    dto: CreateWardDto,
    userId?: string,
  ): Promise<WardEntity> {
    const department = await this.departmentRepository.findOne({
      where: { id: dto.departmentId },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${dto.departmentId} not found`);
    }

    const existingWard = await this.wardRepository.findOne({
      where: { departmentId: dto.departmentId, name: dto.name },
    });

    if (existingWard) {
      throw new ConflictException(
        `Ward "${dto.name}" already exists in this department`,
      );
    }

    const ward = this.wardRepository.create(dto);

    const saved = await this.wardRepository.save(ward);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'CREATE',
      resource: 'ward',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findWardsByDepartment(departmentId: string): Promise<WardEntity[]> {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${departmentId} not found`);
    }

    const wards = await this.wardRepository
      .createQueryBuilder('ward')
      .where('ward.departmentId = :departmentId', { departmentId })
      .loadRelationCountAndMap('ward.bedCount', 'ward.beds')
      .orderBy('ward.name', 'ASC')
      .getMany();

    return wards;
  }

  async updateWard(
    id: string,
    dto: UpdateWardDto,
  ): Promise<WardEntity> {
    const ward = await this.wardRepository.findOne({
      where: { id },
    });

    if (!ward) {
      throw new NotFoundException(`Ward with ID ${id} not found`);
    }

    if (dto.name && dto.name !== ward.name) {
      const existingWard = await this.wardRepository.findOne({
        where: { departmentId: ward.departmentId, name: dto.name },
      });

      if (existingWard) {
        throw new ConflictException(
          `Ward "${dto.name}" already exists in this department`,
        );
      }
    }

    Object.assign(ward, dto);

    const saved = await this.wardRepository.save(ward);

    this.eventPublisher.publishWardUpdated({
      wardId: saved.id,
      departmentId: saved.departmentId,
      name: saved.name,
      changes: {},
    });

    this.eventPublisher.publishAuditLog({
      action: 'UPDATE',
      resource: 'ward',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  // ==================== Bed CRUD ====================

  async createBed(
    dto: CreateBedDto,
    userId?: string,
  ): Promise<BedEntity> {
    const ward = await this.wardRepository.findOne({
      where: { id: dto.wardId },
    });

    if (!ward) {
      throw new NotFoundException(`Ward with ID ${dto.wardId} not found`);
    }

    const existingBed = await this.bedRepository.findOne({
      where: { wardId: dto.wardId, bedNumber: dto.bedNumber },
    });

    if (existingBed) {
      throw new ConflictException(
        `Bed "${dto.bedNumber}" already exists in this ward`,
      );
    }

    const bed = this.bedRepository.create(dto);
    const savedBed = await this.bedRepository.save(bed);

    // Increment ward totalBeds
    ward.totalBeds = ward.totalBeds + 1;
    await this.wardRepository.save(ward);

    this.eventPublisher.publishAuditLog({
      userId,
      action: 'CREATE',
      resource: 'bed',
      resourceId: savedBed.id,
      status: 'success',
    });

    return savedBed;
  }

  async findBedsByWard(wardId: string): Promise<BedEntity[]> {
    const ward = await this.wardRepository.findOne({
      where: { id: wardId },
    });

    if (!ward) {
      throw new NotFoundException(`Ward with ID ${wardId} not found`);
    }

    return this.bedRepository.find({
      where: { wardId, isActive: true },
      order: { bedNumber: 'ASC' },
    });
  }

  async updateBedStatus(
    id: string,
    status: string,
    patientId?: string,
  ): Promise<BedEntity> {
    const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid bed status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const bed = await this.bedRepository.findOne({
      where: { id },
    });

    if (!bed) {
      throw new NotFoundException(`Bed with ID ${id} not found`);
    }

    if (status === 'occupied' && bed.status === 'occupied') {
      throw new ConflictException('Bed is already occupied');
    }

    const oldStatus = bed.status;
    bed.status = status;

    if (status === 'occupied' && patientId) {
      bed.currentPatientId = patientId;
    } else if (status === 'available') {
      bed.currentPatientId = null;
    }

    const saved = await this.bedRepository.save(bed);

    // Publish bed status change so clinical-service can update encounters
    this.eventPublisher.publishBedStatusChanged({
      bedId: saved.id,
      wardId: saved.wardId,
      bedNumber: saved.bedNumber,
      oldStatus,
      newStatus: status,
      patientId,
    });

    this.eventPublisher.publishAuditLog({
      action: 'UPDATE',
      resource: 'bed',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findAvailableBeds(hospitalId?: string, departmentId?: string, wardId?: string): Promise<BedEntity[]> {
    const queryBuilder = this.bedRepository
      .createQueryBuilder('bed')
      .leftJoinAndSelect('bed.ward', 'ward')
      .where('bed.isActive = :isActive', { isActive: true })
      .andWhere('bed.status = :status', { status: 'available' });

    if (wardId) {
      queryBuilder.andWhere('bed.wardId = :wardId', { wardId });
    } else if (departmentId) {
      queryBuilder.andWhere('ward.departmentId = :departmentId', { departmentId });
    } else if (hospitalId) {
      queryBuilder
        .leftJoin('ward.department', 'department')
        .andWhere('department.hospitalId = :hospitalId', { hospitalId });
    }

    queryBuilder.orderBy('ward.name', 'ASC').addOrderBy('bed.bedNumber', 'ASC');

    return queryBuilder.getMany();
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats(): Promise<{
    totalHospitals: number;
    totalDepartments: number;
    totalWards: number;
    totalBeds: number;
    availableBeds: number;
    occupiedBeds: number;
    reservedBeds: number;
    maintenanceBeds: number;
  }> {
    const totalHospitals = await this.hospitalRepository.count({
      where: { isActive: true },
    });

    const totalDepartments = await this.departmentRepository.count({
      where: { isActive: true },
    });

    const totalWards = await this.wardRepository.count({
      where: { isActive: true },
    });

    const totalBeds = await this.bedRepository.count({
      where: { isActive: true },
    });

    const availableBeds = await this.bedRepository.count({
      where: { isActive: true, status: 'available' },
    });

    const occupiedBeds = await this.bedRepository.count({
      where: { isActive: true, status: 'occupied' },
    });

    const reservedBeds = await this.bedRepository.count({
      where: { isActive: true, status: 'reserved' },
    });

    const maintenanceBeds = await this.bedRepository.count({
      where: { isActive: true, status: 'maintenance' },
    });

    return {
      totalHospitals,
      totalDepartments,
      totalWards,
      totalBeds,
      availableBeds,
      occupiedBeds,
      reservedBeds,
      maintenanceBeds,
    };
  }
}
