import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ImagingStatus, ImagingUrgency } from '../entities/imaging-request.entity';

export class UpdateImagingRequestDto {
  @ApiPropertyOptional({
    enum: ['requested', 'scheduled', 'in_progress', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsEnum(['requested', 'scheduled', 'in_progress', 'completed', 'cancelled'])
  status?: ImagingStatus;

  @ApiPropertyOptional({ enum: ['stat', 'urgent', 'routine'] })
  @IsOptional()
  @IsEnum(['stat', 'urgent', 'routine'])
  urgency?: ImagingUrgency;

  @ApiPropertyOptional({ example: '2024-01-20T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: '2024-01-20T11:00:00Z' })
  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @ApiPropertyOptional({ example: 'No abnormalities detected' })
  @IsOptional()
  @IsString()
  results?: string;

  @ApiPropertyOptional({ example: 'https://pacs.hospital.com/report/12345' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reportUrl?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  reportedById?: string;

  @ApiPropertyOptional({ example: 'Dr. Radiologist Name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reportedByName?: string;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
