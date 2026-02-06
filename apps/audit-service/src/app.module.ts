import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuditLogEntity } from './audit/entities/audit-log.entity';
import { DataAccessLogEntity } from './audit/entities/data-access-log.entity';

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
        host: configService.get('AUDIT_DB_HOST', 'localhost'),
        port: configService.get('AUDIT_DB_PORT', 5432),
        username: configService.get('AUDIT_DB_USER', 'clinical_user'),
        password: configService.get('AUDIT_DB_PASSWORD', 'clinical_password'),
        database: configService.get('AUDIT_DB_NAME', 'audit_db'),
        entities: [AuditLogEntity, DataAccessLogEntity],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    AuditModule,
    HealthModule,
    RabbitMQModule,
    MetricsModule,
  ],
})
export class AppModule {}
