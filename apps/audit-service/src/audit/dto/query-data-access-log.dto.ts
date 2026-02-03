import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  IsDateString,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { DataAccessType, DataSensitivity } from '../entities/data-access-log.entity';

export class QueryDataAccessLogDto {
  @ApiPropertyOptional({ example: 'uuid-user-id' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'uuid-patient-id' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ example: 'MRN123456' })
  @IsOptional()
  @IsString()
  patientMrn?: string;

  @ApiPropertyOptional({ example: 'medical_record' })
  @IsOptional()
  @IsString()
  dataType?: string;

  @ApiPropertyOptional({ enum: ['VIEW', 'DOWNLOAD', 'PRINT', 'EXPORT', 'SHARE'] })
  @IsOptional()
  @IsIn(['VIEW', 'DOWNLOAD', 'PRINT', 'EXPORT', 'SHARE'])
  accessType?: DataAccessType;

  @ApiPropertyOptional({ enum: ['PHI', 'PII', 'FINANCIAL', 'GENERAL'] })
  @IsOptional()
  @IsIn(['PHI', 'PII', 'FINANCIAL', 'GENERAL'])
  sensitivity?: DataSensitivity;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  emergencyAccess?: boolean;

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

  @ApiPropertyOptional({ example: 'createdAt', enum: ['createdAt', 'accessType', 'dataType'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
