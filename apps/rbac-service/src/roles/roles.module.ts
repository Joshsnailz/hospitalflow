import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RoleEntity } from './entities/role.entity';
import { RolePermissionEntity } from '../permissions/entities/role-permission.entity';
import { PermissionEntity } from '../permissions/entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEntity, RolePermissionEntity, PermissionEntity]),
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
