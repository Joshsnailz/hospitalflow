import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { EncountersModule } from '../encounters/encounters.module';
import { DischargeModule } from '../discharge/discharge.module';
import { ImagingModule } from '../imaging/imaging.module';
import { ControlledDrugsModule } from '../controlled-drugs/controlled-drugs.module';
import { EmergencyModule } from '../emergency/emergency.module';
import { CarePlansModule } from '../care-plans/care-plans.module';
import { EncounterEntity } from '../encounters/entities/encounter.entity';
import { EmergencyVisitEntity } from '../emergency/entities/emergency-visit.entity';
import { ControlledDrugEntryEntity } from '../controlled-drugs/entities/controlled-drug-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EncounterEntity,
      EmergencyVisitEntity,
      ControlledDrugEntryEntity,
    ]),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get('APPOINTMENT_SERVICE_URL', 'http://localhost:3008'),
        timeout: 10000,
      }),
      inject: [ConfigService],
    }),
    EncountersModule,
    DischargeModule,
    ImagingModule,
    ControlledDrugsModule,
    EmergencyModule,
    CarePlansModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
