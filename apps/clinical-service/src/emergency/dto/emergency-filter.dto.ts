import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmergencyStatus, TriageLevel } from '../entities/emergency-visit.entity';

export class EmergencyFilterDto {
  @ApiPropertyOptional({
    enum: ['waiting', 'triaged', 'being_seen', 'admitted', 'discharged', 'transferred', 'left_without_being_seen'],
  })
  @IsOptional()
  @IsEnum(['waiting', 'triaged', 'being_seen', 'admitted', 'discharged', 'transferred', 'left_without_being_seen'])
  status?: EmergencyStatus;

  @ApiPropertyOptional({
    enum: ['resuscitation', 'emergency', 'urgent', 'semi_urgent', 'non_urgent'],
  })
  @IsOptional()
  @IsEnum(['resuscitation', 'emergency', 'urgent', 'semi_urgent', 'non_urgent'])
  triageLevel?: TriageLevel;

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
    example: 'arrivalTime',
    enum: ['arrivalTime', 'createdAt', 'triageLevel', 'status'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'arrivalTime';

  @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
