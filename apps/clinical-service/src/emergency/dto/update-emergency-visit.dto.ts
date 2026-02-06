import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsObject,
  MaxLength,
} from 'class-validator';
import {
  TriageLevel,
  EmergencyStatus,
  EmergencyDisposition,
} from '../entities/emergency-visit.entity';

export class UpdateEmergencyVisitDto {
  @ApiPropertyOptional({
    enum: ['resuscitation', 'emergency', 'urgent', 'semi_urgent', 'non_urgent'],
  })
  @IsOptional()
  @IsEnum(['resuscitation', 'emergency', 'urgent', 'semi_urgent', 'non_urgent'])
  triageLevel?: TriageLevel;

  @ApiPropertyOptional({ example: 'Updated triage notes' })
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

  @ApiPropertyOptional({ example: 'Updated presenting symptoms' })
  @IsOptional()
  @IsString()
  presentingSymptoms?: string;

  @ApiPropertyOptional({
    example: { heartRate: 90, bloodPressure: '130/80', temperature: 36.8 },
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

  @ApiPropertyOptional({
    enum: ['waiting', 'triaged', 'being_seen', 'admitted', 'discharged', 'transferred', 'left_without_being_seen'],
  })
  @IsOptional()
  @IsEnum(['waiting', 'triaged', 'being_seen', 'admitted', 'discharged', 'transferred', 'left_without_being_seen'])
  status?: EmergencyStatus;

  @ApiPropertyOptional({
    enum: ['admitted', 'discharged_home', 'transferred', 'deceased', 'left_ama'],
  })
  @IsOptional()
  @IsEnum(['admitted', 'discharged_home', 'transferred', 'deceased', 'left_ama'])
  disposition?: EmergencyDisposition;

  @ApiPropertyOptional({ example: '2024-01-15T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  dispositionTime?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
