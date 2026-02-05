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
  MedicalHistoryType,
  MedicalHistoryStatus,
} from '../entities/patient-medical-history.entity';

export class CreateMedicalHistoryDto {
  @ApiPropertyOptional({
    enum: ['condition', 'surgery', 'hospitalization', 'family_history', 'immunization', 'other'],
    default: 'condition',
  })
  @IsOptional()
  @IsEnum(['condition', 'surgery', 'hospitalization', 'family_history', 'immunization', 'other'])
  type?: MedicalHistoryType;

  @ApiProperty({ example: 'Type 2 Diabetes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Diagnosed following routine blood tests' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'E11.9' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  icdCode?: string;

  @ApiPropertyOptional({ example: '2015-03-20' })
  @IsOptional()
  @IsDateString()
  onsetDate?: string;

  @ApiPropertyOptional({ example: '2020-06-15' })
  @IsOptional()
  @IsDateString()
  resolutionDate?: string;

  @ApiPropertyOptional({
    enum: ['active', 'resolved', 'chronic', 'unknown'],
    default: 'unknown',
  })
  @IsOptional()
  @IsEnum(['active', 'resolved', 'chronic', 'unknown'])
  status?: MedicalHistoryStatus;

  @ApiPropertyOptional({ example: 'Dr. Smith at City Hospital' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  diagnosedBy?: string;

  @ApiPropertyOptional({ example: 'Metformin 500mg twice daily' })
  @IsOptional()
  @IsString()
  treatmentNotes?: string;

  @ApiPropertyOptional({ example: 'Mother' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  familyMemberRelation?: string;

  @ApiPropertyOptional({ example: 'Well controlled with medication' })
  @IsOptional()
  @IsString()
  notes?: string;
}
