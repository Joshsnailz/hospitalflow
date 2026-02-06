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
import { AppointmentStatus, AppointmentType } from '../entities/appointment.entity';

export class AppointmentFilterDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'],
  })
  @IsOptional()
  @IsEnum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'])
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    enum: ['consultation', 'follow_up', 'check_up', 'emergency', 'referral', 'lab_review', 'imaging', 'nursing_assessment'],
  })
  @IsOptional()
  @IsEnum(['consultation', 'follow_up', 'check_up', 'emergency', 'referral', 'lab_review', 'imaging', 'nursing_assessment'])
  appointmentType?: AppointmentType;

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
    example: 'scheduledDate',
    enum: ['scheduledDate', 'createdAt', 'status'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'scheduledDate';

  @ApiPropertyOptional({ example: 'ASC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
