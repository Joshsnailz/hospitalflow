import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQPublisherService } from './rabbitmq-publisher.service';
import { AuditPublisherService } from './audit-publisher.service';

export interface RabbitMQModuleOptions {
  serviceName: string;
}

@Global()
@Module({})
export class RabbitMQModule {
  static forRoot(options?: RabbitMQModuleOptions): DynamicModule {
    return {
      module: RabbitMQModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'RABBITMQ_OPTIONS',
          useValue: options || {},
        },
        RabbitMQPublisherService,
        AuditPublisherService,
      ],
      exports: [RabbitMQPublisherService, AuditPublisherService],
    };
  }
}
