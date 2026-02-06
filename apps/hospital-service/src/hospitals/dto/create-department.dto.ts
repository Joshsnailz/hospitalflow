import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn, IsEmail, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ description: 'Hospital ID' })
  @IsUUID()
  @IsNotEmpty()
  hospitalId: string;

  @ApiProperty({ description: 'Department name', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Department type',
    enum: ['clinical', 'administrative', 'support'],
    default: 'clinical',
  })
  @IsString()
  @IsOptional()
  @IsIn(['clinical', 'administrative', 'support'])
  departmentType?: string;

  @ApiPropertyOptional({ description: 'Department description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Head of department user ID' })
  @IsUUID()
  @IsOptional()
  headOfDepartmentId?: string;

  @ApiPropertyOptional({ description: 'Department phone number' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Department email' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Whether department is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
