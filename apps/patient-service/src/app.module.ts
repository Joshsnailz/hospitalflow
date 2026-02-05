import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsModule } from './patients/patients.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import {
  PatientEntity,
  PatientNextOfKinEntity,
  PatientMedicalHistoryEntity,
  PatientAllergyEntity,
  PatientMedicalAidEntity,
} from './patients/entities';

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
        host: configService.get('PATIENT_DB_HOST', 'localhost'),
        port: configService.get('PATIENT_DB_PORT', 5432),
        username: configService.get('PATIENT_DB_USER', 'postgres'),
        password: configService.get('PATIENT_DB_PASSWORD', ''),
        database: configService.get('PATIENT_DB_NAME', 'patient_db'),
        entities: [
          PatientEntity,
          PatientNextOfKinEntity,
          PatientMedicalHistoryEntity,
          PatientAllergyEntity,
          PatientMedicalAidEntity,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    PatientsModule,
    HealthModule,
  ],
})
export class AppModule {}
