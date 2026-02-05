import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import {
  AllergyType,
  AllergySeverity,
  AllergyStatus,
} from '../entities/patient-allergy.entity';

export class CreateAllergyDto {
  @ApiProperty({ example: 'Penicillin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  allergenName: string;

  @ApiPropertyOptional({
    enum: ['drug', 'food', 'environmental', 'other'],
    default: 'other',
  })
  @IsOptional()
  @IsEnum(['drug', 'food', 'environmental', 'other'])
  allergyType?: AllergyType;

  @ApiPropertyOptional({
    enum: ['mild', 'moderate', 'severe', 'life_threatening', 'unknown'],
    default: 'unknown',
  })
  @IsOptional()
  @IsEnum(['mild', 'moderate', 'severe', 'life_threatening', 'unknown'])
  severity?: AllergySeverity;

  @ApiPropertyOptional({ example: 'Skin rash, difficulty breathing' })
  @IsOptional()
  @IsString()
  reaction?: string;

  @ApiPropertyOptional({ example: '2010-06-15' })
  @IsOptional()
  @IsDateString()
  onsetDate?: string;

  @ApiPropertyOptional({ example: '2010-07-01' })
  @IsOptional()
  @IsDateString()
  diagnosedDate?: string;

  @ApiPropertyOptional({ example: 'Dr. Williams' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  diagnosedBy?: string;

  @ApiPropertyOptional({
    enum: ['active', 'inactive', 'resolved'],
    default: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'resolved'])
  status?: AllergyStatus;

  @ApiPropertyOptional({ example: 'Avoid all penicillin-based antibiotics' })
  @IsOptional()
  @IsString()
  notes?: string;
}
