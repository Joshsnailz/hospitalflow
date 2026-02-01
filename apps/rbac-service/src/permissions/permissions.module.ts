import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { UserPermissionEntity } from './entities/user-permission.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { ResourceEntity } from '../resources/entities/resource.entity';
import { ActionEntity } from '../actions/entities/action.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PermissionEntity,
      RolePermissionEntity,
      UserPermissionEntity,
      RoleEntity,
      ResourceEntity,
      ActionEntity,
    ]),
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
