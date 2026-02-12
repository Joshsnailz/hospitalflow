import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2024-02-01T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  newDate: string;

  @ApiPropertyOptional({ example: 'Patient requested later date due to travel' })
  @IsOptional()
  @IsString()
  reason?: string;
}
