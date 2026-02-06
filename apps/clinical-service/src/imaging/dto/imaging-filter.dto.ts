import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ImagingStatus, ImagingType } from '../entities/imaging-request.entity';

export class ImagingFilterDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({
    enum: ['requested', 'scheduled', 'in_progress', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsEnum(['requested', 'scheduled', 'in_progress', 'completed', 'cancelled'])
  status?: ImagingStatus;

  @ApiPropertyOptional({
    enum: ['xray', 'ct_scan', 'mri', 'ultrasound', 'mammogram', 'fluoroscopy'],
  })
  @IsOptional()
  @IsEnum(['xray', 'ct_scan', 'mri', 'ultrasound', 'mammogram', 'fluoroscopy'])
  type?: ImagingType;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'requestedAt',
    enum: ['requestedAt', 'createdAt', 'status', 'urgency'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'requestedAt';

  @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
