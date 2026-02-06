import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';
import { MetricsModule } from './metrics/metrics.module';
import { UserEntity } from './users/entities/user.entity';

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
        host: configService.get('USER_DB_HOST', 'localhost'),
        port: configService.get('USER_DB_PORT', 5432),
        username: configService.get('USER_DB_USER', 'clinical_user'),
        password: configService.get('USER_DB_PASSWORD', 'clinical_password'),
        database: configService.get('USER_DB_NAME', 'user_db'),
        entities: [UserEntity],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    HealthModule,
    EventsModule,
    MetricsModule,
  ],
})
export class AppModule {}
