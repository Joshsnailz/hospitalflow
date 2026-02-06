import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { DrugSchedule, DrugEntryType } from '../entities/controlled-drug-entry.entity';

export class CreateControlledDrugEntryDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ example: '70282487G70' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  patientChi?: string;

  @ApiProperty({ example: 'Morphine Sulphate' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  drugName: string;

  @ApiProperty({ enum: ['schedule_2', 'schedule_3', 'schedule_4', 'schedule_5'] })
  @IsEnum(['schedule_2', 'schedule_3', 'schedule_4', 'schedule_5'])
  @IsNotEmpty()
  drugSchedule: DrugSchedule;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  quantityReceived?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  quantityAdministered?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  quantityWasted?: number;

  @ApiProperty({ example: 'mg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unit: string;

  @ApiPropertyOptional({ example: 'BATCH-2024-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  batchNumber?: string;

  @ApiProperty({ enum: ['receipt', 'administration', 'return', 'destruction'] })
  @IsEnum(['receipt', 'administration', 'return', 'destruction'])
  @IsNotEmpty()
  entryType: DrugEntryType;

  @ApiPropertyOptional({ example: 'Nurse Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  administeredByName?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  witnessId?: string;

  @ApiPropertyOptional({ example: 'Nurse Bob Smith' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  witnessName?: string;

  @ApiPropertyOptional({ example: 'IV' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  route?: string;

  @ApiPropertyOptional({ example: 'Post-operative pain management' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: '2024-01-15T14:30:00Z' })
  @IsDateString()
  @IsNotEmpty()
  administeredAt: string;
}
