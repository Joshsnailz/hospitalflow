import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { AuditService } from '../audit/audit.service';
import { CreateAuditLogDto } from '../audit/dto/create-audit-log.dto';
import { CreateDataAccessLogDto } from '../audit/dto/create-data-access-log.dto';

/** Event wrapper format from publishers */
export interface AuditEventWrapper {
  eventId: string;
  eventType: string;
  timestamp: string;
  correlationId: string;
  source: string;
  version: string;
  payload: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    resource: string;
    resourceId?: string;
    status: 'success' | 'failure' | 'error';
    ipAddress?: string;
    userAgent?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    errorMessage?: string;
  };
}

/** Message payload for audit queue - can be audit log or data-access log */
export interface AuditMessage {
  type?: 'audit' | 'data-access';
  payload: CreateAuditLogDto | CreateDataAccessLogDto;
}

@Injectable()
export class AuditConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditConsumerService.name);
  private connection: any = null;
  private channel: amqp.Channel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 5000;

  private readonly AUDIT_EXCHANGE = 'clinical.audit';
  private readonly DLX_EXCHANGE = 'clinical.dlx';

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect(): Promise<void> {
    const url = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://clinical_user:clinical_password@localhost:5672/clinical_portal',
    );

    try {
      const conn = await amqp.connect(url);
      this.connection = conn;
      const ch = await conn.createChannel();
      this.channel = ch;

      // Ensure exchanges exist
      await ch.assertExchange(this.AUDIT_EXCHANGE, 'direct', { durable: true });
      await ch.assertExchange(this.DLX_EXCHANGE, 'direct', { durable: true });

      const auditQueue = 'audit.logs';
      const dataAccessQueue = 'audit.data-access';
      const dlqAudit = 'audit.logs.dlq';

      // Setup queues with DLX
      const queueOptions = {
        durable: true,
        deadLetterExchange: this.DLX_EXCHANGE,
        deadLetterRoutingKey: 'audit.dead',
      };

      await ch.assertQueue(auditQueue, queueOptions);
      await ch.assertQueue(dataAccessQueue, queueOptions);
      await ch.assertQueue(dlqAudit, { durable: true });

      // Bind queues to exchange
      await ch.bindQueue(auditQueue, this.AUDIT_EXCHANGE, 'audit.log');
      await ch.bindQueue(dataAccessQueue, this.AUDIT_EXCHANGE, 'audit.data-access');
      await ch.bindQueue(dlqAudit, this.DLX_EXCHANGE, 'audit.dead');

      // Set prefetch
      await ch.prefetch(10);

      // Start consuming
      await ch.consume(
        auditQueue,
        async (msg) => {
          if (msg) {
            await this.handleAuditMessage(msg);
          }
        },
        { noAck: false },
      );

      await ch.consume(
        dataAccessQueue,
        async (msg) => {
          if (msg) {
            await this.handleDataAccessMessage(msg);
          }
        },
        { noAck: false },
      );

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log(
        `RabbitMQ consumer connected - queues: ${auditQueue}, ${dataAccessQueue}`,
      );

      conn.on('error', (err: Error) => {
        this.logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      conn.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        this.scheduleReconnect();
      });
    } catch (err) {
      this.logger.warn(`Failed to connect to RabbitMQ: ${(err as Error).message}`);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.logger.log(
        `Scheduling RabbitMQ reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
      );
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      this.logger.error('Max RabbitMQ reconnect attempts reached');
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
      const parsed = JSON.parse(raw);

      let dto: CreateAuditLogDto;

      // Check if this is an event wrapper format (from auth-service, etc.)
      if ('eventType' in parsed && 'payload' in parsed) {
        const event = parsed as AuditEventWrapper;
        dto = {
          userId: event.payload.userId,
          userEmail: event.payload.userEmail,
          userRole: event.payload.userRole,
          action: event.payload.action.toUpperCase() as any,
          resource: event.payload.resource,
          resourceId: event.payload.resourceId,
          status: event.payload.status === 'success' ? 'SUCCESS' : 'FAILURE',
          ipAddress: event.payload.ipAddress,
          userAgent: event.payload.userAgent,
          oldValues: event.payload.oldValues,
          newValues: event.payload.newValues,
          errorMessage: event.payload.errorMessage,
          serviceName: event.source,
          requestId: event.correlationId,
        };
      } else if ('type' in parsed && parsed.type === 'audit') {
        // Legacy format with type wrapper
        dto = parsed.payload as CreateAuditLogDto;
      } else {
        // Direct DTO format
        dto = parsed as CreateAuditLogDto;
      }

      await this.auditService.create(dto);
      this.logger.debug(`Processed audit log: ${dto.action} on ${dto.resource}`);
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
      this.logger.debug(`Processed data access log: ${dto.accessType} on ${dto.dataType}`);
      this.channel?.ack(msg);
    } catch (err) {
      this.logger.error('Failed to process data-access message', err);
      this.channel?.nack(msg, false, false);
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}
