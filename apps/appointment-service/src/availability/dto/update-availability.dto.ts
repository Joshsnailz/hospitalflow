import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { AvailabilityStatus } from '../entities/clinician-availability.entity';

export class UpdateAvailabilityDto {
  @ApiProperty({ enum: ['available', 'offline', 'busy', 'away'] })
  @IsEnum(['available', 'offline', 'busy', 'away'])
  @IsNotEmpty()
  status: AvailabilityStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hospitalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
