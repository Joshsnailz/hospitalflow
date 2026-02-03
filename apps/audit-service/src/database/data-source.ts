import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });
config({ path: '../../.env' });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.AUDIT_DB_HOST || 'localhost',
  port: parseInt(process.env.AUDIT_DB_PORT || '5432', 10),
  username: process.env.AUDIT_DB_USER || 'clinical_user',
  password: process.env.AUDIT_DB_PASSWORD || 'clinical_password',
  database: process.env.AUDIT_DB_NAME || 'audit_db',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
