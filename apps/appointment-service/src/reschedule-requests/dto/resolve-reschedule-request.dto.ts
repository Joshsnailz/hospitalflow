import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString, ValidateIf } from 'class-validator';

export class ResolveRescheduleRequestDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  @IsNotEmpty()
  resolution: 'approved' | 'rejected';

  @ApiPropertyOptional({ example: '2024-02-01T10:00:00Z', description: 'Required when approved' })
  @ValidateIf((o) => o.resolution === 'approved')
  @IsDateString()
  @IsNotEmpty()
  newDate?: string;

  @ApiPropertyOptional({ example: 'Rescheduled to accommodate patient' })
  @IsOptional()
  @IsString()
  notes?: string;
}
