import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({
    example: 'doctor@hospital.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password (min 8 chars, must contain uppercase, lowercase, number)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'doctor',
    description: 'User role',
    enum: [
      'super_admin',
      'consultant',
      'doctor',
      'hospital_pharmacist',
      'pharmacy_technician',
      'pharmacy_support_worker',
      'pharmacy_support_manager',
      'clinical_admin',
      'prescriber',
    ],
  })
  @IsEnum([
    'super_admin',
    'consultant',
    'doctor',
    'hospital_pharmacist',
    'pharmacy_technician',
    'pharmacy_support_worker',
    'pharmacy_support_manager',
    'clinical_admin',
    'prescriber',
  ])
  @IsNotEmpty()
  role: UserRole;
}
