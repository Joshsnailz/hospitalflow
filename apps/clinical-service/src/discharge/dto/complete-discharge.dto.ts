import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
} from 'class-validator';

export class CompleteDischargeDto {
  @ApiPropertyOptional({ example: 'Patient discharged in stable condition' })
  @IsOptional()
  @IsString()
  finalNotes?: string;
}
