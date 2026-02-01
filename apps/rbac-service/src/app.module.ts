import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ResourcesModule } from './resources/resources.module';
import { ActionsModule } from './actions/actions.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { RoleEntity } from './roles/entities/role.entity';
import { ResourceEntity } from './resources/entities/resource.entity';
import { ActionEntity } from './actions/entities/action.entity';
import { PermissionEntity } from './permissions/entities/permission.entity';
import { RolePermissionEntity } from './permissions/entities/role-permission.entity';
import { UserPermissionEntity } from './permissions/entities/user-permission.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('RBAC_DB_HOST', 'localhost'),
        port: configService.get('RBAC_DB_PORT', 5432),
        username: configService.get('RBAC_DB_USER', 'clinical_user'),
        password: configService.get('RBAC_DB_PASSWORD', 'clinical_password'),
        database: configService.get('RBAC_DB_NAME', 'rbac_db'),
        entities: [
          RoleEntity,
          ResourceEntity,
          ActionEntity,
          PermissionEntity,
          RolePermissionEntity,
          UserPermissionEntity,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    RolesModule,
    PermissionsModule,
    ResourcesModule,
    ActionsModule,
    HealthModule,
  ],
})
export class AppModule {}
