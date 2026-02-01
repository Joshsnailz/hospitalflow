import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsIn,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, ALL_ROLES, getRoleDisplayName } from '../../config/roles.config';

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
    enum: ALL_ROLES,
    enumName: 'UserRole',
  })
  @IsIn(ALL_ROLES, {
    message: `Role must be one of: ${ALL_ROLES.join(', ')}`,
  })
  @IsNotEmpty()
  role: UserRole;
}
