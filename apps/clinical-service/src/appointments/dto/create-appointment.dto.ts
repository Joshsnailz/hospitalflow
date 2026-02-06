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

export class CreateAppointmentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: '70282487G70' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  patientChi: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  patientName: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({ example: 'Dr. Jane Smith' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  doctorName: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  @IsNotEmpty()
  hospitalId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({
    enum: ['consultation', 'follow_up', 'check_up', 'emergency', 'referral', 'lab_review', 'imaging', 'nursing_assessment'],
  })
  @IsEnum(['consultation', 'follow_up', 'check_up', 'emergency', 'referral', 'lab_review', 'imaging', 'nursing_assessment'])
  @IsNotEmpty()
  appointmentType: AppointmentType;

  @ApiProperty({ example: '2024-01-20T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @ApiPropertyOptional({ example: '2024-01-20T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ example: 30, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

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

  @ApiPropertyOptional({ example: false, description: 'Auto-assign doctor based on availability' })
  @IsOptional()
  @IsBoolean()
  autoAssign?: boolean;
}
