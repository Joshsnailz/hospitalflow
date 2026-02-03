import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsObject,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { AuditAction, AuditStatus } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @ApiPropertyOptional({ example: 'uuid-user-id' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  userEmail?: string;

  @ApiPropertyOptional({ example: 'doctor' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  userRole?: string;

  @ApiProperty({
    enum: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'APPROVE', 'REJECT', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'PERMISSION_CHANGE', 'ROLE_CHANGE', 'ACCESS_DENIED'],
    example: 'LOGIN',
  })
  @IsNotEmpty()
  @IsString()
  action: AuditAction;

  @ApiPropertyOptional({ example: 'patient' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  resource?: string;

  @ApiPropertyOptional({ example: 'uuid-resource-id' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  resourceId?: string;

  @ApiPropertyOptional({ enum: ['SUCCESS', 'FAILURE', 'PARTIAL'], default: 'SUCCESS' })
  @IsOptional()
  @IsIn(['SUCCESS', 'FAILURE', 'PARTIAL'])
  status?: AuditStatus;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ example: 'User logged in successfully' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: { email: 'old@example.com' } })
  @IsOptional()
  @IsObject()
  oldValues?: Record<string, any>;

  @ApiPropertyOptional({ example: { email: 'new@example.com' } })
  @IsOptional()
  @IsObject()
  newValues?: Record<string, any>;

  @ApiPropertyOptional({ example: { browser: 'Chrome' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: 'req-12345' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestId?: string;

  @ApiPropertyOptional({ example: 'session-12345' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;

  @ApiPropertyOptional({ example: 'auth-service' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  serviceName?: string;

  @ApiPropertyOptional({ example: 'Invalid credentials' })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}
