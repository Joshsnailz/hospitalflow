import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  MaxLength,
} from 'class-validator';

export class UpdateClinicalSectionDto {
  @ApiPropertyOptional({ example: 'Acute myocardial infarction' })
  @IsOptional()
  @IsString()
  dischargeDiagnosis?: string;

  @ApiPropertyOptional({ example: 'Patient admitted with chest pain, treated with...' })
  @IsOptional()
  @IsString()
  clinicalSummary?: string;

  @ApiPropertyOptional({ example: 'Continue medication, follow-up in 2 weeks' })
  @IsOptional()
  @IsString()
  treatmentPlan?: string;

  @ApiPropertyOptional({ example: 'routine' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  dischargeType?: string;

  @ApiPropertyOptional({ example: 'Return to clinic in 2 weeks for follow-up' })
  @IsOptional()
  @IsString()
  followUpInstructions?: string;

  @ApiPropertyOptional({ example: '2024-02-01' })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({ example: 1, description: 'Version for optimistic locking' })
  @IsOptional()
  @IsInt()
  version?: number;
}
