import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsChiNumber } from '../../common/validators/chi-number.validator';
import { Gender, MaritalStatus } from '../entities/patient.entity';

export class CreatePatientDto {
  @ApiProperty({ example: '70282487G70', description: 'CHI Number (11 characters)' })
  @IsChiNumber()
  @IsNotEmpty()
  chiNumber: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'William' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @ApiProperty({ example: '1980-05-15' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiPropertyOptional({ enum: ['male', 'female', 'other', 'unknown'], default: 'unknown' })
  @IsOptional()
  @IsEnum(['male', 'female', 'other', 'unknown'])
  gender?: Gender;

  @ApiPropertyOptional({
    enum: ['single', 'married', 'divorced', 'widowed', 'separated', 'unknown'],
    default: 'unknown',
  })
  @IsOptional()
  @IsEnum(['single', 'married', 'divorced', 'widowed', 'separated', 'unknown'])
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ example: 'British' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationality?: string;

  @ApiPropertyOptional({ example: 'White British' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ethnicity?: string;

  @ApiPropertyOptional({ example: 'English', default: 'English' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  preferredLanguage?: string;

  @ApiPropertyOptional({ example: 'john.doe@email.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '+441onal234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phonePrimary?: string;

  @ApiPropertyOptional({ example: '+441234567891' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneSecondary?: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'London' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Greater London' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  county?: string;

  @ApiPropertyOptional({ example: 'SW1A 1AA' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postCode?: string;

  @ApiPropertyOptional({ example: 'United Kingdom' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: 'Dr. Jane Smith' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gpName?: string;

  @ApiPropertyOptional({ example: 'City Medical Centre' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gpPracticeName?: string;

  @ApiPropertyOptional({ example: '456 Health Street, London, SW1A 2BB' })
  @IsOptional()
  @IsString()
  gpPracticeAddress?: string;

  @ApiPropertyOptional({ example: '+441onal234567892' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gpPhone?: string;

  @ApiPropertyOptional({ example: 'reception@citymedical.nhs.uk' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  gpEmail?: string;

  @ApiPropertyOptional({ example: 'Patient requires wheelchair access' })
  @IsOptional()
  @IsString()
  notes?: string;
}
