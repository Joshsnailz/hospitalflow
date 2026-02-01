import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { UserPermissionType } from '../entities/user-permission.entity';

export class GrantUserPermissionDto {
  @ApiProperty({ example: 'uuid-permission-id' })
  @IsUUID()
  @IsNotEmpty()
  permissionId: string;

  @ApiPropertyOptional({ enum: ['grant', 'deny'], default: 'grant' })
  @IsOptional()
  @IsEnum(['grant', 'deny'])
  type?: UserPermissionType;

  @ApiPropertyOptional({ example: 'Temporary access for project X' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
