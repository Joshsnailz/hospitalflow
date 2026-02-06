import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsUUID, IsEnum } from 'class-validator';

export class CompleteAppointmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether to create an encounter from this appointment' })
  @IsOptional()
  @IsBoolean()
  createEncounter?: boolean;

  @ApiPropertyOptional({ enum: ['inpatient', 'outpatient', 'emergency', 'day_case'] })
  @IsOptional()
  @IsEnum(['inpatient', 'outpatient', 'emergency', 'day_case'])
  encounterType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  admissionDiagnosis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  wardId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bedId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hospitalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
