import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReferAppointmentDto {
  @ApiProperty({
    description: 'ID of the clinician to refer the appointment to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  referToClinicianId: string;

  @ApiPropertyOptional({
    description: 'Optional notes about the referral',
    example: 'Patient requires specialist consultation for cardiac issues',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
