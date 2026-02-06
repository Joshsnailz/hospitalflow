import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentEntity } from './entities';
import { EncountersModule } from '../encounters/encounters.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppointmentEntity]),
    EncountersModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
