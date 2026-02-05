import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import {
  BaseEvent,
  EventRoutingKey,
  Exchanges,
  EventRoutingKeys,
  AuditLogEvent,
  DataAccessLogEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeactivatedEvent,
  UserActivatedEvent,
  UserRoleChangedEvent,
} from './event-types';

@Injectable()
export class RabbitMQPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQPublisherService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 5000;
  private readonly serviceName: string;

  constructor(private readonly configService: ConfigService) {
    this.serviceName = this.configService.get('SERVICE_NAME', 'unknown-service');
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    const rabbitmqUrl = this.configService.get('RABBITMQ_URL', 'amqp://clinical_user:clinical_password@localhost:5672/clinical_portal');

    try {
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Ensure exchanges exist
      await this.channel.assertExchange(Exchanges.EVENTS, 'topic', { durable: true });
      await this.channel.assertExchange(Exchanges.AUDIT, 'direct', { durable: true });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log('Successfully connected to RabbitMQ');

      // Handle connection events
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        this.scheduleReconnect();
      });

    } catch (error) {
      this.logger.warn(`Failed to connect to RabbitMQ: ${error.message}`);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.logger.log(`Scheduling RabbitMQ reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      this.logger.error('Max RabbitMQ reconnect attempts reached. Running without message queue.');
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  private createBaseEvent(eventType: EventRoutingKey, correlationId?: string): Omit<BaseEvent, 'payload'> {
    return {
      eventId: uuidv4(),
      eventType,
      timestamp: new Date().toISOString(),
      correlationId: correlationId || uuidv4(),
      source: this.serviceName,
      version: '1.0',
    };
  }

  private async publish(exchange: string, routingKey: string, event: BaseEvent): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      this.logger.warn(`Cannot publish event ${event.eventType}: Not connected to RabbitMQ`);
      return false;
    }

    try {
      const message = Buffer.from(JSON.stringify(event));
      this.channel.publish(exchange, routingKey, message, {
        persistent: true,
        contentType: 'application/json',
        messageId: event.eventId,
        correlationId: event.correlationId,
        timestamp: Date.now(),
        headers: {
          source: this.serviceName,
          eventType: event.eventType,
        },
      });

      this.logger.debug(`Published event ${event.eventType} with ID ${event.eventId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to publish event ${event.eventType}:`, error);
      return false;
    }
  }

  // ==========================================
  // USER EVENTS
  // ==========================================

  async publishUserCreated(payload: UserCreatedEvent['payload'], correlationId?: string): Promise<boolean> {
    const event: UserCreatedEvent = {
      ...this.createBaseEvent(EventRoutingKeys.USER_CREATED, correlationId),
      eventType: EventRoutingKeys.USER_CREATED,
      payload,
    };
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.USER_CREATED, event);
  }

  async publishUserUpdated(payload: UserUpdatedEvent['payload'], correlationId?: string): Promise<boolean> {
    const event: UserUpdatedEvent = {
      ...this.createBaseEvent(EventRoutingKeys.USER_UPDATED, correlationId),
      eventType: EventRoutingKeys.USER_UPDATED,
      payload,
    };
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.USER_UPDATED, event);
  }

  async publishUserDeactivated(payload: UserDeactivatedEvent['payload'], correlationId?: string): Promise<boolean> {
    const event: UserDeactivatedEvent = {
      ...this.createBaseEvent(EventRoutingKeys.USER_DEACTIVATED, correlationId),
      eventType: EventRoutingKeys.USER_DEACTIVATED,
      payload,
    };
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.USER_DEACTIVATED, event);
  }

  async publishUserActivated(payload: UserActivatedEvent['payload'], correlationId?: string): Promise<boolean> {
    const event: UserActivatedEvent = {
      ...this.createBaseEvent(EventRoutingKeys.USER_ACTIVATED, correlationId),
      eventType: EventRoutingKeys.USER_ACTIVATED,
      payload,
    };
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.USER_ACTIVATED, event);
  }

  async publishUserRoleChanged(payload: UserRoleChangedEvent['payload'], correlationId?: string): Promise<boolean> {
    const event: UserRoleChangedEvent = {
      ...this.createBaseEvent(EventRoutingKeys.USER_ROLE_CHANGED, correlationId),
      eventType: EventRoutingKeys.USER_ROLE_CHANGED,
      payload,
    };
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.USER_ROLE_CHANGED, event);
  }

  // ==========================================
  // AUDIT EVENTS
  // ==========================================

  async publishAuditLog(payload: AuditLogEvent['payload'], correlationId?: string): Promise<boolean> {
    const event: AuditLogEvent = {
      ...this.createBaseEvent(EventRoutingKeys.AUDIT_LOG, correlationId),
      eventType: EventRoutingKeys.AUDIT_LOG,
      payload,
    };
    return this.publish(Exchanges.AUDIT, 'audit.log', event);
  }

  async publishDataAccessLog(payload: DataAccessLogEvent['payload'], correlationId?: string): Promise<boolean> {
    const event: DataAccessLogEvent = {
      ...this.createBaseEvent(EventRoutingKeys.AUDIT_DATA_ACCESS, correlationId),
      eventType: EventRoutingKeys.AUDIT_DATA_ACCESS,
      payload,
    };
    return this.publish(Exchanges.AUDIT, 'audit.data-access', event);
  }

  // ==========================================
  // GENERIC PUBLISH
  // ==========================================

  async publishEvent(routingKey: EventRoutingKey, payload: any, correlationId?: string): Promise<boolean> {
    const exchange = routingKey.startsWith('audit.') ? Exchanges.AUDIT : Exchanges.EVENTS;
    const event: BaseEvent = {
      ...this.createBaseEvent(routingKey, correlationId),
      payload,
    } as any;
    return this.publish(exchange, routingKey, event);
  }

  // ==========================================
  // STATUS CHECK
  // ==========================================

  isHealthy(): boolean {
    return this.isConnected;
  }
}
