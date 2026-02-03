import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsObject,
  IsArray,
  IsBoolean,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { DataAccessType, DataSensitivity } from '../entities/data-access-log.entity';

export class CreateDataAccessLogDto {
  @ApiProperty({ example: 'uuid-user-id' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  userEmail: string;

  @ApiProperty({ example: 'doctor' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  userRole: string;

  @ApiPropertyOptional({ example: 'uuid-patient-id' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ example: 'MRN123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  patientMrn?: string;

  @ApiProperty({ example: 'medical_record' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  dataType: string;

  @ApiProperty({ enum: ['VIEW', 'DOWNLOAD', 'PRINT', 'EXPORT', 'SHARE'], example: 'VIEW' })
  @IsNotEmpty()
  @IsIn(['VIEW', 'DOWNLOAD', 'PRINT', 'EXPORT', 'SHARE'])
  accessType: DataAccessType;

  @ApiPropertyOptional({ enum: ['PHI', 'PII', 'FINANCIAL', 'GENERAL'], default: 'PHI' })
  @IsOptional()
  @IsIn(['PHI', 'PII', 'FINANCIAL', 'GENERAL'])
  sensitivity?: DataSensitivity;

  @ApiPropertyOptional({ example: 'uuid-record-id' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recordId?: string;

  @ApiPropertyOptional({ example: 'lab_result' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recordType?: string;

  @ApiPropertyOptional({ example: 'Reviewing patient chart for consultation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  accessReason?: string;

  @ApiPropertyOptional({ example: ['diagnosis', 'medications', 'lab_results'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fieldsAccessed?: string[];

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  @IsOptional()
  @IsString()
  userAgent?: string;

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

  @ApiPropertyOptional({ example: { department: 'Cardiology' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  emergencyAccess?: boolean;

  @ApiPropertyOptional({ example: 'Emergency cardiac event' })
  @IsOptional()
  @IsString()
  breakGlassReason?: string;
}
