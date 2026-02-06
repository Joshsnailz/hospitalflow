import { Module, Global } from '@nestjs/common';
import { EventConsumerService } from './event-consumer.service';
import { ClinicalEventPublisherService } from './event-publisher.service';

@Global()
@Module({
  providers: [EventConsumerService, ClinicalEventPublisherService],
  exports: [EventConsumerService, ClinicalEventPublisherService],
})
export class EventsModule {}
