import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDepartmentDto } from './create-department.dto';

export class UpdateDepartmentDto extends PartialType(
  OmitType(CreateDepartmentDto, ['hospitalId'] as const),
) {}
