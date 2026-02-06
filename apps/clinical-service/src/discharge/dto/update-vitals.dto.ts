import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsString,
} from 'class-validator';

export class UpdateVitalsDto {
  @ApiPropertyOptional({ example: 36.5 })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ example: '120/80' })
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @ApiPropertyOptional({ example: 72 })
  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @ApiPropertyOptional({ example: 16 })
  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;

  @ApiPropertyOptional({ example: 98 })
  @IsOptional()
  @IsNumber()
  oxygenSaturation?: number;

  @ApiPropertyOptional({ example: 75.5 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: 175 })
  @IsOptional()
  @IsNumber()
  height?: number;
}
