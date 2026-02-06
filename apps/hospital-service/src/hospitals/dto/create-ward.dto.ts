import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWardDto {
  @ApiProperty({ description: 'Department ID' })
  @IsUUID()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ description: 'Ward name', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Ward type',
    enum: ['general', 'icu', 'maternity', 'paediatric', 'psychiatric', 'surgical'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['general', 'icu', 'maternity', 'paediatric', 'psychiatric', 'surgical'])
  wardType: string;

  @ApiPropertyOptional({ description: 'Floor location' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  floor?: string;

  @ApiPropertyOptional({ description: 'Building name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  building?: string;

  @ApiPropertyOptional({ description: 'Total number of beds', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  totalBeds?: number;

  @ApiPropertyOptional({ description: 'Nurse station phone number' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  nurseStationPhone?: string;

  @ApiPropertyOptional({ description: 'Whether ward is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
