import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProcedurePerformedDto {
  @IsString()
  name: string;

  @IsString()
  date: string;

  @IsString()
  surgeon: string;

  @IsString()
  notes: string;

  @IsString()
  outcome: string;
}

export class UpdateOperationsSectionDto {
  @ApiPropertyOptional({
    type: [ProcedurePerformedDto],
    description: 'Array of operations and procedures performed',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcedurePerformedDto)
  operationsAndProcedures?: ProcedurePerformedDto[];

  @ApiPropertyOptional({ example: 'No complications during procedures' })
  @IsOptional()
  @IsString()
  surgeonNotes?: string;

  @ApiPropertyOptional({ example: 1, description: 'Version for optimistic locking' })
  @IsOptional()
  @IsInt()
  version?: number;
}
