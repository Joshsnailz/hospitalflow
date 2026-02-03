import { Module } from '@nestjs/common';
import { AuditConsumerService } from './audit-consumer.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [AuditConsumerService],
})
export class RabbitMQModule {}
