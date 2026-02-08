import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentEntity } from './entities';
import { EncountersModule } from '../encounters/encounters.module';
import { ClinicalEventsModule } from '../events/events.module';
import { QueueService, AssignmentService } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppointmentEntity]),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get('USER_SERVICE_URL', 'http://localhost:3002'),
        timeout: 5000,
      }),
      inject: [ConfigService],
    }),
    ClinicalEventsModule,
    EncountersModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, QueueService, AssignmentService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
