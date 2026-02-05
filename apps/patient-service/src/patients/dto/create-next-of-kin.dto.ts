import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RelationshipType } from '../entities/patient-next-of-kin.entity';

export class CreateNextOfKinDto {
  @ApiProperty({ example: 'Jane' })
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

  @ApiPropertyOptional({
    enum: [
      'spouse',
      'parent',
      'child',
      'sibling',
      'grandparent',
      'grandchild',
      'aunt_uncle',
      'niece_nephew',
      'cousin',
      'friend',
      'partner',
      'guardian',
      'other',
    ],
    default: 'other',
  })
  @IsOptional()
  @IsEnum([
    'spouse',
    'parent',
    'child',
    'sibling',
    'grandparent',
    'grandchild',
    'aunt_uncle',
    'niece_nephew',
    'cousin',
    'friend',
    'partner',
    'guardian',
    'other',
  ])
  relationship?: RelationshipType;

  @ApiProperty({ example: '+441234567890' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phonePrimary: string;

  @ApiPropertyOptional({ example: '+441234567891' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneSecondary?: string;

  @ApiPropertyOptional({ example: 'jane.doe@email.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

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

  @ApiPropertyOptional({ example: 'SW1A 1AA' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postCode?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimaryContact?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEmergencyContact?: boolean;

  @ApiPropertyOptional({ example: 'Lives next door' })
  @IsOptional()
  @IsString()
  notes?: string;
}
