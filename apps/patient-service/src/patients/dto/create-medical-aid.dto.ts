import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { MedicalAidStatus } from '../entities/patient-medical-aid.entity';

export class CreateMedicalAidDto {
  @ApiProperty({ example: 'BUPA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  providerName: string;

  @ApiPropertyOptional({ example: 'Gold Plan' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  planName?: string;

  @ApiProperty({ example: 'MEM123456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  membershipNumber: string;

  @ApiPropertyOptional({ example: 'GRP001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  groupNumber?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  policyHolderName?: string;

  @ApiPropertyOptional({ example: 'Self' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  policyHolderRelationship?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    enum: ['active', 'expired', 'suspended', 'cancelled'],
    default: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'expired', 'suspended', 'cancelled'])
  status?: MedicalAidStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: '+441234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'support@bupa.co.uk' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'Corporate policy through employer' })
  @IsOptional()
  @IsString()
  notes?: string;
}
