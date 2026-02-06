import { IsString, IsNotEmpty, IsOptional, IsIn, IsEmail, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHospitalDto {
  @ApiProperty({ description: 'Hospital name', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Hospital description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Facility type',
    enum: ['hospital', 'clinic', 'satellite'],
    default: 'hospital',
  })
  @IsString()
  @IsOptional()
  @IsIn(['hospital', 'clinic', 'satellite'])
  facilityType?: string;

  @ApiPropertyOptional({ description: 'Address line 1' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Province (Zimbabwe provinces)',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  province?: string;

  @ApiPropertyOptional({ description: 'Country', default: 'Zimbabwe' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ description: 'Primary phone number' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phonePrimary?: string;

  @ApiPropertyOptional({ description: 'Emergency phone number' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneEmergency?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Whether hospital is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
