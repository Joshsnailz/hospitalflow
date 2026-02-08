import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectAppointmentDto {
  @ApiProperty({
    description: 'Reason for rejecting the appointment',
    example: 'Not available at this time',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  reason: string;
}
