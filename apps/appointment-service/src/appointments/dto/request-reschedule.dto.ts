import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RequestRescheduleDto {
  @ApiProperty({ example: 'Conflict with emergency surgery' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
