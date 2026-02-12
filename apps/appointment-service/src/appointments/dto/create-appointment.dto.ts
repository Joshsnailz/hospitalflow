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
  ValidateIf,
} from 'class-validator';
import { AppointmentType, AppointmentPriority, AppointmentScenario } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty({ enum: ['emergency', 'walk_in', 'scheduled'] })
  @IsEnum(['emergency', 'walk_in', 'scheduled'])
  @IsNotEmpty()
  scenario: AppointmentScenario;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @ValidateIf((o) => o.scenario !== 'emergency' || !o.isEmergencyUnknown)
  @IsUUID()
  @IsNotEmpty()
  patientId?: string;

  @ApiPropertyOptional({ example: '70282487G70' })
  @ValidateIf((o) => o.scenario !== 'emergency' || !o.isEmergencyUnknown)
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  patientChi?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @ValidateIf((o) => o.scenario !== 'emergency' || !o.isEmergencyUnknown)
  @IsString()
  @IsNotEmpty()
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

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  @IsNotEmpty()
  hospitalId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({
    enum: ['consultation', 'follow_up', 'check_up', 'emergency', 'referral', 'lab_review', 'imaging', 'nursing_assessment', 'walk_in'],
  })
  @IsEnum(['consultation', 'follow_up', 'check_up', 'emergency', 'referral', 'lab_review', 'imaging', 'nursing_assessment', 'walk_in'])
  @IsNotEmpty()
  appointmentType: AppointmentType;

  @ApiPropertyOptional({ example: '2024-01-20T10:00:00Z' })
  @ValidateIf((o) => o.scenario === 'scheduled')
  @IsDateString()
  @IsNotEmpty()
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

  @ApiPropertyOptional({ description: 'True for unknown emergency patients' })
  @IsOptional()
  @IsBoolean()
  isEmergencyUnknown?: boolean;

  @ApiPropertyOptional({ example: 'John Doe (Unknown)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyAlias?: string;

  @ApiPropertyOptional({ example: 'Chest trauma, possible internal bleeding' })
  @IsOptional()
  @IsString()
  emergencyConditions?: string;

  @ApiPropertyOptional({ description: 'Preferred clinician for scheduled appointments' })
  @IsOptional()
  @IsUUID()
  preferredClinicianId?: string;

  @ApiPropertyOptional({ example: 'Dr. Smith - Consultant' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  preferredClinicianName?: string;
}
