import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole, ROLES } from '../../config/roles.config';

export class UpdateRoleDto {
  @ApiProperty({
    enum: Object.values(ROLES),
    example: ROLES.CONSULTANT,
    description: 'The new role to assign to the user',
  })
  @IsNotEmpty()
  @IsEnum(Object.values(ROLES))
  role: UserRole;
}
