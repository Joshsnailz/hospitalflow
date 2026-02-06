import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBedDto } from './create-bed.dto';

export class UpdateBedDto extends PartialType(
  OmitType(CreateBedDto, ['wardId'] as const),
) {}
