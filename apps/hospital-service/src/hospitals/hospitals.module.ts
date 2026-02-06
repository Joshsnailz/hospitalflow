import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  HospitalsController,
  DepartmentsController,
  WardsController,
  BedsController,
} from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import {
  HospitalEntity,
  DepartmentEntity,
  WardEntity,
  BedEntity,
} from './entities';
import { EventPublisherService } from '../events/event-publisher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HospitalEntity,
      DepartmentEntity,
      WardEntity,
      BedEntity,
    ]),
  ],
  controllers: [
    HospitalsController,
    DepartmentsController,
    WardsController,
    BedsController,
  ],
  providers: [HospitalsService, EventPublisherService],
  exports: [HospitalsService],
})
export class HospitalsModule {}
