import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { AppointmentStatus, AppointmentPriority } from '../entities/appointment.entity';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ example: 'Dr. Jane Smith' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  doctorName?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ example: '2024-01-20T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: '2024-01-20T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ example: 30, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({
    enum: ['scheduled', 'confirmed', 'pending_acceptance', 'pending_reschedule', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'],
  })
  @IsOptional()
  @IsEnum(['scheduled', 'confirmed', 'pending_acceptance', 'pending_reschedule', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'])
  status?: AppointmentStatus;

  @ApiPropertyOptional({ enum: ['urgent', 'high', 'normal', 'low'] })
  @IsOptional()
  @IsEnum(['urgent', 'high', 'normal', 'low'])
  priority?: AppointmentPriority;

  @ApiPropertyOptional({ example: 'Updated reason' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
