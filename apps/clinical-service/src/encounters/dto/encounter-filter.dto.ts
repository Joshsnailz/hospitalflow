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
import { EncounterStatus, EncounterType } from '../entities/encounter.entity';

export class EncounterFilterDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440005' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({
    enum: ['admitted', 'in_treatment', 'awaiting_discharge', 'discharged', 'deceased', 'transferred'],
  })
  @IsOptional()
  @IsEnum(['admitted', 'in_treatment', 'awaiting_discharge', 'discharged', 'deceased', 'transferred'])
  status?: EncounterStatus;

  @ApiPropertyOptional({ enum: ['inpatient', 'outpatient', 'emergency', 'day_case'] })
  @IsOptional()
  @IsEnum(['inpatient', 'outpatient', 'emergency', 'day_case'])
  encounterType?: EncounterType;

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
    example: 'createdAt',
    enum: ['createdAt', 'admissionDate', 'status'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
