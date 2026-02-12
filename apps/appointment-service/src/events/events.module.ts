import { Module, Global } from '@nestjs/common';
import { EventConsumerService } from './event-consumer.service';
import { AppointmentEventPublisherService } from './event-publisher.service';

@Global()
@Module({
  providers: [EventConsumerService, AppointmentEventPublisherService],
  exports: [EventConsumerService, AppointmentEventPublisherService],
})
export class EventsModule {}
