import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AcceptAppointmentDto {
  @ApiPropertyOptional({ example: 'Will see patient at 10:30' })
  @IsOptional()
  @IsString()
  notes?: string;
}
