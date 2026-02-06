import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  IsDateString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CarePlanGoalDto {
  @IsString()
  goal: string;

  @IsString()
  targetDate: string;

  @IsString()
  status: string;
}

export class CarePlanInterventionDto {
  @IsString()
  intervention: string;

  @IsString()
  frequency: string;

  @IsString()
  responsibleRole: string;

  @IsString()
  notes: string;
}

export class CreateCarePlanDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: '70282487G70' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  patientChi: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiProperty({ example: 'Post-operative Recovery Plan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Comprehensive recovery plan following cardiac surgery' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    type: [CarePlanGoalDto],
    description: 'Care plan goals',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarePlanGoalDto)
  goals?: CarePlanGoalDto[];

  @ApiPropertyOptional({
    type: [CarePlanInterventionDto],
    description: 'Care plan interventions',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarePlanInterventionDto)
  interventions?: CarePlanInterventionDto[];

  @ApiPropertyOptional({ example: '2024-02-15' })
  @IsOptional()
  @IsDateString()
  reviewDate?: string;

  @ApiPropertyOptional({ enum: ['urgent', 'high', 'normal', 'low'], default: 'normal' })
  @IsOptional()
  @IsEnum(['urgent', 'high', 'normal', 'low'])
  priority?: string;

  @ApiProperty({ example: 'Dr. John Smith' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  createdByName: string;

  @ApiPropertyOptional({ example: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
