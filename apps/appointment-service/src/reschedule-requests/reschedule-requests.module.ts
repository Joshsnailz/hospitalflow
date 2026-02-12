import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RescheduleRequestEntity } from './entities/reschedule-request.entity';
import { RescheduleRequestsService } from './reschedule-requests.service';
import { RescheduleRequestsController } from './reschedule-requests.controller';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RescheduleRequestEntity]),
    forwardRef(() => AppointmentsModule),
  ],
  controllers: [RescheduleRequestsController],
  providers: [RescheduleRequestsService],
  exports: [RescheduleRequestsService],
})
export class RescheduleRequestsModule {}
