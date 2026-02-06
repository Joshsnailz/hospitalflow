import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HospitalsModule } from './hospitals/hospitals.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import {
  HospitalEntity,
  DepartmentEntity,
  WardEntity,
  BedEntity,
} from './hospitals/entities';

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
        host: configService.get('HOSPITAL_DB_HOST', 'localhost'),
        port: configService.get('HOSPITAL_DB_PORT', 5432),
        username: configService.get('HOSPITAL_DB_USER', 'postgres'),
        password: configService.get('HOSPITAL_DB_PASSWORD', ''),
        database: configService.get('HOSPITAL_DB_NAME', 'hospital_db'),
        entities: [
          HospitalEntity,
          DepartmentEntity,
          WardEntity,
          BedEntity,
        ],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    HospitalsModule,
    HealthModule,
  ],
})
export class AppModule {}
