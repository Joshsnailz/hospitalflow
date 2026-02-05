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
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
