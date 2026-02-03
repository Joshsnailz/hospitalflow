import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction, AuditStatus } from '../entities/audit-log.entity';

export class QueryAuditLogDto {
  @ApiPropertyOptional({ example: 'uuid-user-id' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({
    enum: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'APPROVE', 'REJECT', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'PERMISSION_CHANGE', 'ROLE_CHANGE', 'ACCESS_DENIED'],
  })
  @IsOptional()
  @IsString()
  action?: AuditAction;

  @ApiPropertyOptional({ example: 'patient' })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({ example: 'uuid-resource-id' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ enum: ['SUCCESS', 'FAILURE', 'PARTIAL'] })
  @IsOptional()
  @IsIn(['SUCCESS', 'FAILURE', 'PARTIAL'])
  status?: AuditStatus;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'auth-service' })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 50;

  @ApiPropertyOptional({ example: 'createdAt', enum: ['createdAt', 'action', 'resource'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
