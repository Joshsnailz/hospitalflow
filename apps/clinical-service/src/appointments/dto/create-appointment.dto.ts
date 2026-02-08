import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { AppointmentType, AppointmentPriority } from '../entities/appointment.entity';

const APPOINTMENT_TYPES = [
  'consultation',
  'follow_up',
  'check_up',
  'emergency',
  'referral',
  'lab_review',
  'imaging',
  'imaging_review',
  'nursing_assessment',
  'procedure',
];

export class CreateAppointmentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({ example: '70282487G70' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  patientChi?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  patientName?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ example: 'Dr. Jane Smith' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  doctorName?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  hospitalId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ enum: APPOINTMENT_TYPES })
  @IsEnum(APPOINTMENT_TYPES)
  @IsNotEmpty()
  appointmentType: AppointmentType;

  @ApiProperty({ example: '2024-01-20T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @ApiPropertyOptional({ example: '10:30', description: 'HH:mm time when scheduledDate is date-only' })
  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @ApiPropertyOptional({ example: '2024-01-20T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ example: 30, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 30, description: 'Alias for durationMinutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ enum: ['urgent', 'high', 'normal', 'low'], default: 'normal' })
  @IsOptional()
  @IsEnum(['urgent', 'high', 'normal', 'low'])
  priority?: AppointmentPriority;

  @ApiPropertyOptional({ example: 'Follow-up consultation for chest pain' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'Patient requested morning appointment' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440004' })
  @IsOptional()
  @IsUUID()
  referredById?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  autoAssign?: boolean;
}
