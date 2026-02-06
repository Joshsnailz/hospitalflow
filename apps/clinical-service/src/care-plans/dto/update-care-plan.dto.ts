import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  IsDateString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CarePlanGoalDto, CarePlanInterventionDto } from './create-care-plan.dto';
import { CarePlanStatus } from '../entities/care-plan.entity';

export class UpdateCarePlanDto {
  @ApiPropertyOptional({ example: 'Updated Care Plan Title' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [CarePlanGoalDto],
    description: 'Updated goals',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarePlanGoalDto)
  goals?: CarePlanGoalDto[];

  @ApiPropertyOptional({
    type: [CarePlanInterventionDto],
    description: 'Updated interventions',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarePlanInterventionDto)
  interventions?: CarePlanInterventionDto[];

  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsOptional()
  @IsDateString()
  reviewDate?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  reviewedById?: string;

  @ApiPropertyOptional({ example: 'Dr. Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reviewedByName?: string;

  @ApiPropertyOptional({ enum: ['active', 'completed', 'suspended', 'cancelled'] })
  @IsOptional()
  @IsEnum(['active', 'completed', 'suspended', 'cancelled'])
  status?: CarePlanStatus;

  @ApiPropertyOptional({ enum: ['urgent', 'high', 'normal', 'low'] })
  @IsOptional()
  @IsEnum(['urgent', 'high', 'normal', 'low'])
  priority?: string;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
