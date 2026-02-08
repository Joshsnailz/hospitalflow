import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
} from 'class-validator';

export class UpdateFollowUpSectionDto {
  @ApiPropertyOptional({ example: 'Return to clinic in 2 weeks for wound check' })
  @IsOptional()
  @IsString()
  followUpInstructions?: string;

  @ApiPropertyOptional({ example: '2024-02-01' })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({ example: 'Dr. Smith, Cardiology' })
  @IsOptional()
  @IsString()
  followUpDoctor?: string;

  @ApiPropertyOptional({ example: 'Patient educated on wound care, medication adherence...' })
  @IsOptional()
  @IsString()
  patientEducation?: string;

  @ApiPropertyOptional({ example: 1, description: 'Version for optimistic locking' })
  @IsOptional()
  @IsInt()
  version?: number;
}
