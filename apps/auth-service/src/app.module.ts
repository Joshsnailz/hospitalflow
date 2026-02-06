import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';
import { MetricsModule } from './metrics/metrics.module';
import { UserEntity } from './users/entities/user.entity';
import { RefreshTokenEntity } from './auth/entities/refresh-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('AUTH_DB_HOST', 'localhost'),
        port: configService.get('AUTH_DB_PORT', 5432),
        username: configService.get('AUTH_DB_USER', 'clinical_user'),
        password: configService.get('AUTH_DB_PASSWORD', 'clinical_password'),
        database: configService.get('AUTH_DB_NAME', 'auth_db'),
        entities: [UserEntity, RefreshTokenEntity],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    EventsModule,
    AuthModule,
    HealthModule,
    MetricsModule,
  ],
})
export class AppModule {}
