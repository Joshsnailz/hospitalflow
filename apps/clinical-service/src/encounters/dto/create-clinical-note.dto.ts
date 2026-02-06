import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { NoteType } from '../entities/clinical-note.entity';

export class CreateClinicalNoteDto {
  @ApiProperty({ example: 'Dr. John Smith' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  authorName: string;

  @ApiProperty({ example: 'doctor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  authorRole: string;

  @ApiProperty({ enum: ['progress', 'nursing', 'consultation', 'procedure', 'assessment'] })
  @IsEnum(['progress', 'nursing', 'consultation', 'procedure', 'assessment'])
  @IsNotEmpty()
  noteType: NoteType;

  @ApiPropertyOptional({ example: 'Daily Progress Note' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ example: 'Patient showing improvement in respiratory function...' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
