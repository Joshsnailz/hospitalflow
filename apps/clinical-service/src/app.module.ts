import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';
import { EncountersModule } from './encounters/encounters.module';
import { DischargeModule } from './discharge/discharge.module';
import { ImagingModule } from './imaging/imaging.module';
import { ControlledDrugsModule } from './controlled-drugs/controlled-drugs.module';
import { EmergencyModule } from './emergency/emergency.module';
import { CarePlansModule } from './care-plans/care-plans.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EncounterEntity, ClinicalNoteEntity } from './encounters/entities';
import { DischargeFormEntity } from './discharge/entities';
import { ImagingRequestEntity } from './imaging/entities';
import { ControlledDrugEntryEntity } from './controlled-drugs/entities';
import { EmergencyVisitEntity } from './emergency/entities';
import { CarePlanEntity } from './care-plans/entities';

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
        host: configService.get('CLINICAL_DB_HOST', 'localhost'),
        port: configService.get('CLINICAL_DB_PORT', 5432),
        username: configService.get('CLINICAL_DB_USER', 'postgres'),
        password: configService.get('CLINICAL_DB_PASSWORD', ''),
        database: configService.get('CLINICAL_DB_NAME', 'clinical_db'),
        entities: [
          EncounterEntity,
          ClinicalNoteEntity,
          DischargeFormEntity,
          ImagingRequestEntity,
          ControlledDrugEntryEntity,
          EmergencyVisitEntity,
          CarePlanEntity,
        ],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    HealthModule,
    EventsModule,
    EncountersModule,
    DischargeModule,
    ImagingModule,
    ControlledDrugsModule,
    EmergencyModule,
    CarePlansModule,
    DashboardModule,
  ],
})
export class AppModule {}
