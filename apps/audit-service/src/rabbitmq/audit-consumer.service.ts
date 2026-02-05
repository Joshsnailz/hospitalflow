import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { AuditService } from '../audit/audit.service';
import { CreateAuditLogDto } from '../audit/dto/create-audit-log.dto';
import { CreateDataAccessLogDto } from '../audit/dto/create-data-access-log.dto';

/** Message payload for audit queue - can be audit log or data-access log */
export interface AuditMessage {
  type?: 'audit' | 'data-access';
  payload: CreateAuditLogDto | CreateDataAccessLogDto;
}

@Injectable()
export class AuditConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditConsumerService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    const url = this.configService.get<string>('RABBITMQ_URL');
    if (!url) {
      this.logger.warn('RABBITMQ_URL not set - async audit ingestion disabled');
      return;
    }

    try {
      const conn = await amqp.connect(url);
      this.connection = conn;
      this.channel = await conn.createChannel();

      const auditQueue = this.configService.get<string>('AUDIT_QUEUE', 'audit.logs');
      const dataAccessQueue = this.configService.get<string>(
        'AUDIT_DATA_ACCESS_QUEUE',
        'audit.data-access',
      );

      await this.channel.assertQueue(auditQueue, { durable: true });
      await this.channel.assertQueue(dataAccessQueue, { durable: true });

      await this.channel.consume(
        auditQueue,
        async (msg) => {
          if (msg) {
            await this.handleAuditMessage(msg);
          }
        },
        { noAck: false },
      );

      await this.channel.consume(
        dataAccessQueue,
        async (msg) => {
          if (msg) {
            await this.handleDataAccessMessage(msg);
          }
        },
        { noAck: false },
      );

      this.logger.log(
        `RabbitMQ consumer connected - queues: ${auditQueue}, ${dataAccessQueue}`,
      );
    } catch (err) {
      this.logger.error('Failed to connect to RabbitMQ', err);
      // Non-fatal: HTTP endpoints and sync logging still work
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch (err) {
      this.logger.warn('Error closing RabbitMQ connection', err);
    }
  }

  private async handleAuditMessage(msg: amqp.ConsumeMessage) {
    try {
      const raw = msg.content.toString();
      const parsed = JSON.parse(raw) as AuditMessage | CreateAuditLogDto;

      const dto: CreateAuditLogDto =
        'payload' in parsed && parsed.type === 'audit'
          ? (parsed.payload as CreateAuditLogDto)
          : (parsed as CreateAuditLogDto);

      await this.auditService.create(dto);
      this.channel?.ack(msg);
    } catch (err) {
      this.logger.error('Failed to process audit message', err);
      this.channel?.nack(msg, false, false); // Don't requeue invalid messages
    }
  }

  private async handleDataAccessMessage(msg: amqp.ConsumeMessage) {
    try {
      const raw = msg.content.toString();
      const parsed = JSON.parse(raw) as AuditMessage | CreateDataAccessLogDto;

      const dto: CreateDataAccessLogDto =
        'payload' in parsed && parsed.type === 'data-access'
          ? (parsed.payload as CreateDataAccessLogDto)
          : (parsed as CreateDataAccessLogDto);

      await this.auditService.createDataAccessLog(dto);
      this.channel?.ack(msg);
    } catch (err) {
      this.logger.error('Failed to process data-access message', err);
      this.channel?.nack(msg, false, false);
    }
  }
}
