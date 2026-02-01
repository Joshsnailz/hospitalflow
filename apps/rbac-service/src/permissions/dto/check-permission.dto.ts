import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CheckPermissionDto {
  @ApiProperty({ example: 'uuid-user-id' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'super_admin' })
  @IsString()
  @IsNotEmpty()
  userRole: string;

  @ApiProperty({ example: 'patient' })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({ example: 'read' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiPropertyOptional({ example: 'all' })
  @IsOptional()
  @IsString()
  scope?: string;
}
