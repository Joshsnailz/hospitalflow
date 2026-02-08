import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDischargeFormDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({ example: '70282487G70' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  patientChi?: string;

  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  patientName?: string;

  @ApiPropertyOptional({ example: 'Acute myocardial infarction', description: 'Alias: primaryDiagnosis' })
  @IsOptional()
  @IsString()
  dischargeDiagnosis?: string;

  @ApiPropertyOptional({ example: 'Acute myocardial infarction', description: 'Alias for dischargeDiagnosis' })
  @IsOptional()
  @IsString()
  primaryDiagnosis?: string;

  @ApiPropertyOptional({ example: 'Patient admitted with chest pain...' })
  @IsOptional()
  @IsString()
  clinicalSummary?: string;
}
