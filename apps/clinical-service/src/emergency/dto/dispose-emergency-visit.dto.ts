import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class DisposeEmergencyVisitDto {
  @ApiProperty({ enum: ['admitted', 'discharged_home', 'transferred', 'deceased', 'left_ama'] })
  @IsNotEmpty()
  @IsEnum(['admitted', 'discharged_home', 'transferred', 'deceased', 'left_ama'])
  disposition: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Required when disposition is admitted' })
  @IsOptional()
  @IsUUID()
  hospitalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  wardId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bedId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  admittingDoctorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  admissionDiagnosis?: string;
}
