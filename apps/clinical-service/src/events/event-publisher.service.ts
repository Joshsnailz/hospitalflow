import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

export const Exchanges = {
  EVENTS: 'clinical.events',
  AUDIT: 'clinical.audit',
} as const;

@Injectable()
export class ClinicalEventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClinicalEventPublisherService.name);
  private connection: any = null;
  private channel: amqp.Channel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 5000;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    const rabbitmqUrl = this.configService.get(
      'RABBITMQ_URL',
      'amqp://clinical_user:clinical_password@localhost:5672/clinical_portal',
    );

    try {
      const conn = await amqp.connect(rabbitmqUrl);
      this.connection = conn;
      const ch = await conn.createChannel();
      this.channel = ch;

      await ch.assertExchange(Exchanges.AUDIT, 'direct', { durable: true });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log('Clinical event publisher connected to RabbitMQ');

      conn.on('error', (err: Error) => {
        this.logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      conn.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        this.scheduleReconnect();
      });
    } catch (error) {
      this.logger.warn(`Failed to connect to RabbitMQ: ${(error as Error).message}`);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.isConnected = false;
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  async publishAuditLog(payload: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    resource: string;
    resourceId?: string;
    status: 'success' | 'failure';
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
  }): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      this.logger.warn('Cannot publish audit log: Not connected to RabbitMQ');
      return false;
    }

    try {
      const event = {
        eventId: uuidv4(),
        eventType: 'audit.log',
        timestamp: new Date().toISOString(),
        correlationId: uuidv4(),
        source: 'clinical-service',
        version: '1.0',
        payload,
      };

      const message = Buffer.from(JSON.stringify(event));
      this.channel.publish(Exchanges.AUDIT, 'audit.log', message, {
        persistent: true,
        contentType: 'application/json',
        messageId: event.eventId,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to publish audit log:', error);
      return false;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}
