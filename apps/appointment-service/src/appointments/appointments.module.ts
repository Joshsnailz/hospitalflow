import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppointmentEntity } from './entities/appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { RoundRobinModule } from '../round-robin/round-robin.module';
import { AvailabilityModule } from '../availability/availability.module';
import { RescheduleRequestsModule } from '../reschedule-requests/reschedule-requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppointmentEntity]),
    RoundRobinModule,
    AvailabilityModule,
    forwardRef(() => RescheduleRequestsModule),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get('CLINICAL_SERVICE_URL', 'http://localhost:3006'),
        timeout: 10000,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
