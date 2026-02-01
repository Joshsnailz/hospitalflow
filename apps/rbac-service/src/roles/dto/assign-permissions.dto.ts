import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'Array of permission IDs to assign to the role',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}
