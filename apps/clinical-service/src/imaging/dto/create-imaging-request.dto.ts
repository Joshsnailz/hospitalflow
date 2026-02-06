import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ImagingType, ImagingUrgency } from '../entities/imaging-request.entity';

export class CreateImagingRequestDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: '70282487G70' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  patientChi: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiProperty({ example: 'Dr. John Smith' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  requestedByName: string;

  @ApiProperty({ enum: ['xray', 'ct_scan', 'mri', 'ultrasound', 'mammogram', 'fluoroscopy'] })
  @IsEnum(['xray', 'ct_scan', 'mri', 'ultrasound', 'mammogram', 'fluoroscopy'])
  @IsNotEmpty()
  imagingType: ImagingType;

  @ApiProperty({ example: 'Chest' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bodyPart: string;

  @ApiProperty({ example: 'Suspected pneumonia, persistent cough for 2 weeks' })
  @IsString()
  @IsNotEmpty()
  clinicalIndication: string;

  @ApiPropertyOptional({ enum: ['stat', 'urgent', 'routine'], default: 'routine' })
  @IsOptional()
  @IsEnum(['stat', 'urgent', 'routine'])
  urgency?: ImagingUrgency;

  @ApiPropertyOptional({ example: 'Patient allergic to contrast dye' })
  @IsOptional()
  @IsString()
  notes?: string;
}
