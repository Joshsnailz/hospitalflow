import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsObject,
} from 'class-validator';

export class UpdateNursingSectionDto {
  @ApiPropertyOptional({ example: 'Patient is mobile and able to self-care' })
  @IsOptional()
  @IsString()
  nursingNotes?: string;

  @ApiPropertyOptional({ example: 'Patient assessed as fit for discharge from nursing perspective' })
  @IsOptional()
  @IsString()
  nursingAssessment?: string;

  @ApiPropertyOptional({ description: 'Vital signs on discharge: bp, hr, temp, spo2, rr' })
  @IsOptional()
  @IsObject()
  vitalSignsOnDischarge?: {
    bp?: string;
    hr?: string;
    temp?: string;
    spo2?: string;
    rr?: string;
    weight?: string;
    height?: string;
  };

  @ApiPropertyOptional({ example: 'Low sodium diet, avoid alcohol' })
  @IsOptional()
  @IsString()
  dietaryInstructions?: string;

  @ApiPropertyOptional({ example: 'No heavy lifting for 6 weeks, no driving for 2 weeks' })
  @IsOptional()
  @IsString()
  activityRestrictions?: string;

  @ApiPropertyOptional({ example: 1, description: 'Version for optimistic locking' })
  @IsOptional()
  @IsInt()
  version?: number;
}
