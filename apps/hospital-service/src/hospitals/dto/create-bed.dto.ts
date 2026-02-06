import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBedDto {
  @ApiProperty({ description: 'Ward ID' })
  @IsUUID()
  @IsNotEmpty()
  wardId: string;

  @ApiProperty({ description: 'Bed number', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  bedNumber: string;

  @ApiProperty({
    description: 'Bed type',
    enum: ['standard', 'electric', 'icu', 'crib'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['standard', 'electric', 'icu', 'crib'])
  bedType: string;

  @ApiPropertyOptional({
    description: 'Bed status',
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available',
  })
  @IsString()
  @IsOptional()
  @IsIn(['available', 'occupied', 'reserved', 'maintenance'])
  status?: string;

  @ApiPropertyOptional({ description: 'Current patient ID' })
  @IsUUID()
  @IsOptional()
  currentPatientId?: string;

  @ApiPropertyOptional({ description: 'Whether bed is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
