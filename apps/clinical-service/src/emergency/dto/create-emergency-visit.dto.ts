import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsObject,
  MaxLength,
} from 'class-validator';
import { TriageLevel } from '../entities/emergency-visit.entity';

export class CreateEmergencyVisitDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: '70282487G70' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  patientChi: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ example: '2024-01-15T14:30:00Z' })
  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @ApiProperty({ enum: ['resuscitation', 'emergency', 'urgent', 'semi_urgent', 'non_urgent'] })
  @IsEnum(['resuscitation', 'emergency', 'urgent', 'semi_urgent', 'non_urgent'])
  @IsNotEmpty()
  triageLevel: TriageLevel;

  @ApiPropertyOptional({ example: 'Patient presenting with severe chest pain' })
  @IsOptional()
  @IsString()
  triageNotes?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  triagedById?: string;

  @ApiPropertyOptional({ example: 'Nurse Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  triagedByName?: string;

  @ApiProperty({ example: 'Severe chest pain radiating to left arm' })
  @IsString()
  @IsNotEmpty()
  chiefComplaint: string;

  @ApiPropertyOptional({ example: 'Shortness of breath, diaphoresis, nausea' })
  @IsOptional()
  @IsString()
  presentingSymptoms?: string;

  @ApiPropertyOptional({
    example: { heartRate: 110, bloodPressure: '150/90', temperature: 37.2 },
  })
  @IsOptional()
  @IsObject()
  vitalSigns?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsOptional()
  @IsUUID()
  attendingDoctorId?: string;

  @ApiPropertyOptional({ example: 'Dr. John Smith' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  attendingDoctorName?: string;

  @ApiPropertyOptional({ example: 'Initial assessment notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
