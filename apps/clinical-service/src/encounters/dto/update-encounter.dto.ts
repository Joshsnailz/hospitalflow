import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { EncounterStatus } from '../entities/encounter.entity';

export class UpdateEncounterDto {
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

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440006' })
  @IsOptional()
  @IsUUID()
  attendingDoctorId?: string;

  @ApiPropertyOptional({
    enum: ['admitted', 'in_treatment', 'awaiting_discharge', 'discharged', 'deceased', 'transferred'],
  })
  @IsOptional()
  @IsEnum(['admitted', 'in_treatment', 'awaiting_discharge', 'discharged', 'deceased', 'transferred'])
  status?: EncounterStatus;

  @ApiPropertyOptional({ example: '2024-01-20T14:00:00Z' })
  @IsOptional()
  @IsDateString()
  dischargeDate?: string;

  @ApiPropertyOptional({ example: 'Updated chief complaint' })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiPropertyOptional({ example: 'Updated admission diagnosis' })
  @IsOptional()
  @IsString()
  admissionDiagnosis?: string;

  @ApiPropertyOptional({ example: 'Final discharge diagnosis' })
  @IsOptional()
  @IsString()
  dischargeDiagnosis?: string;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
