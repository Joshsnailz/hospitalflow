import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { EncounterType } from '../entities/encounter.entity';

export class CreateEncounterDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: '70282487G70' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  patientChi: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsNotEmpty()
  hospitalId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsOptional()
  @IsUUID()
  wardId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440004' })
  @IsOptional()
  @IsUUID()
  bedId?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440005' })
  @IsUUID()
  @IsNotEmpty()
  admittingDoctorId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440006' })
  @IsOptional()
  @IsUUID()
  attendingDoctorId?: string;

  @ApiProperty({ enum: ['inpatient', 'outpatient', 'emergency', 'day_case'] })
  @IsEnum(['inpatient', 'outpatient', 'emergency', 'day_case'])
  @IsNotEmpty()
  encounterType: EncounterType;

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  admissionDate: string;

  @ApiPropertyOptional({ example: 'Chest pain and shortness of breath' })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiPropertyOptional({ example: 'Suspected acute coronary syndrome' })
  @IsOptional()
  @IsString()
  admissionDiagnosis?: string;

  @ApiPropertyOptional({ example: 'Additional admission notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
