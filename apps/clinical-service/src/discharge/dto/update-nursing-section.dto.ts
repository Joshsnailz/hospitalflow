import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
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

  @ApiPropertyOptional({ example: 1, description: 'Version for optimistic locking' })
  @IsOptional()
  @IsInt()
  version?: number;
}
