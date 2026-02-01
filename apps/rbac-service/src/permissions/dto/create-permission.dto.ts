import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsEnum, MaxLength } from 'class-validator';
import { PermissionScope } from '../entities/permission.entity';

export class CreatePermissionDto {
  @ApiProperty({ example: 'uuid-resource-id' })
  @IsUUID()
  @IsNotEmpty()
  resourceId: string;

  @ApiProperty({ example: 'uuid-action-id' })
  @IsUUID()
  @IsNotEmpty()
  actionId: string;

  @ApiPropertyOptional({ enum: ['all', 'own', 'department', 'assigned'], default: 'all' })
  @IsOptional()
  @IsEnum(['all', 'own', 'department', 'assigned'])
  scope?: PermissionScope;

  @ApiPropertyOptional({ example: 'Description of what this permission allows' })
  @IsOptional()
  @IsString()
  description?: string;
}
