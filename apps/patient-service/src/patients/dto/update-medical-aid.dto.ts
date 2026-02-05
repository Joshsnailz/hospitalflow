import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { MedicalAidStatus } from '../entities/patient-medical-aid.entity';

export class UpdateMedicalAidDto {
  @ApiPropertyOptional({ example: 'BUPA' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerName?: string;

  @ApiPropertyOptional({ example: 'Gold Plan' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  planName?: string;

  @ApiPropertyOptional({ example: 'MEM123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  membershipNumber?: string;

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
