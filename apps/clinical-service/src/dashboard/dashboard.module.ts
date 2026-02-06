import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { EncountersModule } from '../encounters/encounters.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { DischargeModule } from '../discharge/discharge.module';
import { ImagingModule } from '../imaging/imaging.module';
import { ControlledDrugsModule } from '../controlled-drugs/controlled-drugs.module';
import { EmergencyModule } from '../emergency/emergency.module';
import { CarePlansModule } from '../care-plans/care-plans.module';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { EncounterEntity } from '../encounters/entities/encounter.entity';
import { EmergencyVisitEntity } from '../emergency/entities/emergency-visit.entity';
import { ControlledDrugEntryEntity } from '../controlled-drugs/entities/controlled-drug-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentEntity,
      EncounterEntity,
      EmergencyVisitEntity,
      ControlledDrugEntryEntity,
    ]),
    EncountersModule,
    AppointmentsModule,
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
