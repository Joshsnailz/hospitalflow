import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { RoleEntity } from '../../roles/entities/role.entity';
import { ResourceEntity } from '../../resources/entities/resource.entity';
import { ActionEntity } from '../../actions/entities/action.entity';
import { PermissionEntity } from '../../permissions/entities/permission.entity';
import { RolePermissionEntity } from '../../permissions/entities/role-permission.entity';
import { UserPermissionEntity } from '../../permissions/entities/user-permission.entity';
import { seedInitialData } from './initial-data.seed';

// Load environment variables
config({ path: '.env' });
config({ path: '../../.env' });

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.RBAC_DB_HOST || 'localhost',
    port: parseInt(process.env.RBAC_DB_PORT || '5432', 10),
    username: process.env.RBAC_DB_USER || 'clinical_user',
    password: process.env.RBAC_DB_PASSWORD || 'clinical_password',
    database: process.env.RBAC_DB_NAME || 'rbac_db',
    entities: [
      RoleEntity,
      ResourceEntity,
      ActionEntity,
      PermissionEntity,
      RolePermissionEntity,
      UserPermissionEntity,
    ],
    synchronize: true,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected successfully');

    await seedInitialData(dataSource);

    await dataSource.destroy();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error running seed:', error);
    process.exit(1);
  }
}

runSeed();
