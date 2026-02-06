import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import {
  PatientEntity,
  PatientNextOfKinEntity,
  PatientMedicalHistoryEntity,
  PatientAllergyEntity,
  PatientMedicalAidEntity,
} from './entities';
import { EventPublisherService } from '../events/event-publisher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PatientEntity,
      PatientNextOfKinEntity,
      PatientMedicalHistoryEntity,
      PatientAllergyEntity,
      PatientMedicalAidEntity,
    ]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService, EventPublisherService],
  exports: [PatientsService],
})
export class PatientsModule {}
