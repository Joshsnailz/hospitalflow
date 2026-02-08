import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DischargeMedicationDto {
  @IsString()
  name: string;

  @IsString()
  dosage: string;

  @IsString()
  frequency: string;

  @IsString()
  duration: string;

  @IsString()
  route: string;

  @IsString()
  instructions: string;
}

export class UpdatePharmacySectionDto {
  @ApiPropertyOptional({
    type: [DischargeMedicationDto],
    description: 'Array of medications on discharge',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DischargeMedicationDto)
  medicationsOnDischarge?: DischargeMedicationDto[];

  @ApiPropertyOptional({ example: 'All medications reconciled with home medications' })
  @IsOptional()
  @IsString()
  pharmacyNotes?: string;

  @ApiPropertyOptional({ example: 1, description: 'Version for optimistic locking' })
  @IsOptional()
  @IsInt()
  version?: number;
}
