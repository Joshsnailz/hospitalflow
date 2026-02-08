import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  MaxLength,
} from 'class-validator';

export class UpdateClinicalSectionDto {
  @ApiPropertyOptional({ example: 'Acute myocardial infarction' })
  @IsOptional()
  @IsString()
  primaryDiagnosis?: string;

  @ApiPropertyOptional({ example: ['Hypertension', 'Type 2 diabetes'] })
  @IsOptional()
  @IsArray()
  secondaryDiagnoses?: string[];

  @ApiPropertyOptional({ example: 'Patient admitted with chest pain, treated with...' })
  @IsOptional()
  @IsString()
  clinicalSummary?: string;

  @ApiPropertyOptional({ example: 'IV antibiotics, wound debridement, physiotherapy' })
  @IsOptional()
  @IsString()
  treatmentProvided?: string;

  @ApiPropertyOptional({ example: 'routine' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  dischargeType?: string;

  @ApiPropertyOptional({ example: 1, description: 'Version for optimistic locking' })
  @IsOptional()
  @IsInt()
  version?: number;
}
