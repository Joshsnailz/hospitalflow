import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';
import { DataAccessLogEntity } from './entities/data-access-log.entity';
import {
  CreateAuditLogDto,
  CreateDataAccessLogDto,
  QueryAuditLogDto,
  QueryDataAccessLogDto,
} from './dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
    @InjectRepository(DataAccessLogEntity)
    private readonly dataAccessLogRepository: Repository<DataAccessLogEntity>,
  ) {}

  /**
   * Find an audit log by ID.
   */
  async findLogById(id: string): Promise<AuditLogEntity> {
    const log = await this.auditLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return log;
  }

  /**
   * Find a data access log by ID.
   */
  async findDataAccessLogById(id: string): Promise<DataAccessLogEntity> {
    const log = await this.dataAccessLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Data access log with ID ${id} not found`);
    }
    return log;
  }

  /**
   * Create an audit log entry (immutable - no updates/deletes for HIPAA compliance).
   */
  async create(dto: CreateAuditLogDto): Promise<AuditLogEntity> {
    const log = this.auditLogRepository.create({
      userId: dto.userId ?? null,
      userEmail: dto.userEmail ?? null,
      userRole: dto.userRole ?? null,
      action: dto.action,
      resource: dto.resource ?? null,
      resourceId: dto.resourceId ?? null,
      status: dto.status ?? 'SUCCESS',
      ipAddress: dto.ipAddress ?? null,
      userAgent: dto.userAgent ?? null,
      description: dto.description ?? null,
      oldValues: dto.oldValues ?? null,
      newValues: dto.newValues ?? null,
      metadata: dto.metadata ?? null,
      requestId: dto.requestId ?? null,
      sessionId: dto.sessionId ?? null,
      serviceName: dto.serviceName ?? null,
      errorMessage: dto.errorMessage ?? null,
    });
    return this.auditLogRepository.save(log);
  }

  /**
   * Create a PHI/data access log entry for HIPAA tracking.
   */
  async createDataAccessLog(dto: CreateDataAccessLogDto): Promise<DataAccessLogEntity> {
    const log = this.dataAccessLogRepository.create({
      userId: dto.userId,
      userEmail: dto.userEmail,
      userRole: dto.userRole,
      patientId: dto.patientId ?? null,
      patientMrn: dto.patientMrn ?? null,
      dataType: dto.dataType,
      accessType: dto.accessType,
      sensitivity: dto.sensitivity ?? 'PHI',
      recordId: dto.recordId ?? null,
      recordType: dto.recordType ?? null,
      accessReason: dto.accessReason ?? null,
      fieldsAccessed: dto.fieldsAccessed ?? null,
      ipAddress: dto.ipAddress ?? null,
      userAgent: dto.userAgent ?? null,
      requestId: dto.requestId ?? null,
      sessionId: dto.sessionId ?? null,
      metadata: dto.metadata ?? null,
      emergencyAccess: dto.emergencyAccess ?? false,
      breakGlassReason: dto.breakGlassReason ?? null,
    });
    return this.dataAccessLogRepository.save(log);
  }

  /**
   * Query audit logs with filters and pagination.
   */
  async queryLogs(query: QueryAuditLogDto): Promise<PaginatedResult<AuditLogEntity>> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      startDate,
      endDate,
      ...filters
    } = query;

    const qb = this.auditLogRepository.createQueryBuilder('log');

    if (filters.userId) qb.andWhere('log.user_id = :userId', { userId: filters.userId });
    if (filters.userEmail) qb.andWhere('log.user_email ILIKE :userEmail', { userEmail: `%${filters.userEmail}%` });
    if (filters.action) qb.andWhere('log.action = :action', { action: filters.action });
    if (filters.resource) qb.andWhere('log.resource = :resource', { resource: filters.resource });
    if (filters.resourceId) qb.andWhere('log.resource_id = :resourceId', { resourceId: filters.resourceId });
    if (filters.status) qb.andWhere('log.status = :status', { status: filters.status });
    if (filters.ipAddress) qb.andWhere('log.ip_address = :ipAddress', { ipAddress: filters.ipAddress });
    if (filters.serviceName) qb.andWhere('log.service_name = :serviceName', { serviceName: filters.serviceName });

    if (startDate && endDate) {
      qb.andWhere('log.created_at BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } else if (startDate) {
      qb.andWhere('log.created_at >= :startDate', { startDate: new Date(startDate) });
    } else if (endDate) {
      qb.andWhere('log.created_at <= :endDate', { endDate: new Date(endDate) });
    }

    const validSortColumns = ['createdAt', 'action', 'resource', 'userId', 'status'];
    const orderBy = validSortColumns.includes(sortBy) ? `log.${sortBy}` : 'log.createdAt';
    qb.orderBy(orderBy, sortOrder);

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Query PHI data access logs with filters and pagination.
   */
  async queryDataAccessLogs(
    query: QueryDataAccessLogDto,
  ): Promise<PaginatedResult<DataAccessLogEntity>> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      startDate,
      endDate,
      ...filters
    } = query;

    const qb = this.dataAccessLogRepository.createQueryBuilder('log');

    if (filters.userId) qb.andWhere('log.user_id = :userId', { userId: filters.userId });
    if (filters.patientId) qb.andWhere('log.patient_id = :patientId', { patientId: filters.patientId });
    if (filters.patientMrn) qb.andWhere('log.patient_mrn = :patientMrn', { patientMrn: filters.patientMrn });
    if (filters.dataType) qb.andWhere('log.data_type = :dataType', { dataType: filters.dataType });
    if (filters.accessType) qb.andWhere('log.access_type = :accessType', { accessType: filters.accessType });
    if (filters.sensitivity) qb.andWhere('log.sensitivity = :sensitivity', { sensitivity: filters.sensitivity });
    if (filters.emergencyAccess !== undefined) {
      qb.andWhere('log.emergency_access = :emergencyAccess', { emergencyAccess: filters.emergencyAccess });
    }

    if (startDate && endDate) {
      qb.andWhere('log.created_at BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } else if (startDate) {
      qb.andWhere('log.created_at >= :startDate', { startDate: new Date(startDate) });
    } else if (endDate) {
      qb.andWhere('log.created_at <= :endDate', { endDate: new Date(endDate) });
    }

    const validSortColumns = ['createdAt', 'accessType', 'dataType', 'userId', 'patientId'];
    const orderBy = validSortColumns.includes(sortBy) ? `log.${sortBy}` : 'log.createdAt';
    qb.orderBy(orderBy, sortOrder);

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit statistics for dashboard.
   */
  async getStatistics(startDate?: string, endDate?: string): Promise<{
    totalAuditLogs: number;
    totalDataAccessLogs: number;
    auditLogsByAction: Record<string, number>;
    auditLogsByStatus: Record<string, number>;
    dataAccessByType: Record<string, number>;
    dataAccessBySensitivity: Record<string, number>;
    emergencyAccessCount: number;
    uniqueUsersCount: number;
    uniquePatientsAccessedCount: number;
  }> {
    const auditQb = this.auditLogRepository.createQueryBuilder('log');
    const dataAccessQb = this.dataAccessLogRepository.createQueryBuilder('log');

    if (startDate && endDate) {
      auditQb.andWhere('log.created_at BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      dataAccessQb.andWhere('log.created_at BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const [totalAuditLogs, totalDataAccessLogs] = await Promise.all([
      auditQb.getCount(),
      dataAccessQb.getCount(),
    ]);

    // Audit logs by action
    const actionStats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action')
      .getRawMany();

    const auditLogsByAction: Record<string, number> = {};
    actionStats.forEach((stat) => {
      auditLogsByAction[stat.action] = parseInt(stat.count, 10);
    });

    // Audit logs by status
    const statusStats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.status')
      .getRawMany();

    const auditLogsByStatus: Record<string, number> = {};
    statusStats.forEach((stat) => {
      auditLogsByStatus[stat.status] = parseInt(stat.count, 10);
    });

    // Data access by type
    const accessTypeStats = await this.dataAccessLogRepository
      .createQueryBuilder('log')
      .select('log.access_type', 'accessType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.access_type')
      .getRawMany();

    const dataAccessByType: Record<string, number> = {};
    accessTypeStats.forEach((stat) => {
      dataAccessByType[stat.accessType] = parseInt(stat.count, 10);
    });

    // Data access by sensitivity
    const sensitivityStats = await this.dataAccessLogRepository
      .createQueryBuilder('log')
      .select('log.sensitivity', 'sensitivity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.sensitivity')
      .getRawMany();

    const dataAccessBySensitivity: Record<string, number> = {};
    sensitivityStats.forEach((stat) => {
      dataAccessBySensitivity[stat.sensitivity] = parseInt(stat.count, 10);
    });

    // Emergency access count
    const emergencyAccessCount = await this.dataAccessLogRepository.count({
      where: { emergencyAccess: true },
    });

    // Unique users count
    const uniqueUsersResult = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.user_id)', 'count')
      .getRawOne();
    const uniqueUsersCount = parseInt(uniqueUsersResult?.count || '0', 10);

    // Unique patients accessed count
    const uniquePatientsResult = await this.dataAccessLogRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.patient_id)', 'count')
      .getRawOne();
    const uniquePatientsAccessedCount = parseInt(uniquePatientsResult?.count || '0', 10);

    return {
      totalAuditLogs,
      totalDataAccessLogs,
      auditLogsByAction,
      auditLogsByStatus,
      dataAccessByType,
      dataAccessBySensitivity,
      emergencyAccessCount,
      uniqueUsersCount,
      uniquePatientsAccessedCount,
    };
  }
}
