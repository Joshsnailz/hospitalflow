import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

// Event types
export const EventRoutingKeys = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DEACTIVATED: 'user.deactivated',
  USER_ACTIVATED: 'user.activated',
  USER_ROLE_CHANGED: 'user.role.changed',
  AUDIT_LOG: 'audit.log',
} as const;

export const Exchanges = {
  EVENTS: 'clinical.events',
  AUDIT: 'clinical.audit',
} as const;

export interface UserCreatedPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface UserUpdatedPayload {
  userId: string;
  email: string;
  changes: Record<string, { old: any; new: any }>;
}

export interface AuditLogPayload {
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
}

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection: amqp.Connection | null = null;
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
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Ensure exchanges exist
      await this.channel.assertExchange(Exchanges.EVENTS, 'topic', { durable: true });
      await this.channel.assertExchange(Exchanges.AUDIT, 'direct', { durable: true });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log('Connected to RabbitMQ');

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
      this.logger.log(
        `Scheduling RabbitMQ reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
      );
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      this.logger.error('Max RabbitMQ reconnect attempts reached');
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

  private async publish(
    exchange: string,
    routingKey: string,
    payload: any,
    correlationId?: string,
  ): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      this.logger.warn(`Cannot publish ${routingKey}: Not connected to RabbitMQ`);
      return false;
    }

    try {
      const event = {
        eventId: uuidv4(),
        eventType: routingKey,
        timestamp: new Date().toISOString(),
        correlationId: correlationId || uuidv4(),
        source: 'auth-service',
        version: '1.0',
        payload,
      };

      const message = Buffer.from(JSON.stringify(event));
      this.channel.publish(exchange, routingKey, message, {
        persistent: true,
        contentType: 'application/json',
        messageId: event.eventId,
        correlationId: event.correlationId,
        timestamp: Date.now(),
      });

      this.logger.debug(`Published ${routingKey} event`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to publish ${routingKey}:`, error);
      return false;
    }
  }

  // User Events
  async publishUserCreated(payload: UserCreatedPayload, correlationId?: string): Promise<boolean> {
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.USER_CREATED, payload, correlationId);
  }

  async publishUserUpdated(payload: UserUpdatedPayload, correlationId?: string): Promise<boolean> {
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.USER_UPDATED, payload, correlationId);
  }

  async publishUserDeactivated(
    payload: { userId: string; email: string },
    correlationId?: string,
  ): Promise<boolean> {
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.USER_DEACTIVATED, payload, correlationId);
  }

  async publishUserActivated(
    payload: { userId: string; email: string },
    correlationId?: string,
  ): Promise<boolean> {
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.USER_ACTIVATED, payload, correlationId);
  }

  async publishUserRoleChanged(
    payload: { userId: string; email: string; oldRole: string; newRole: string },
    correlationId?: string,
  ): Promise<boolean> {
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.USER_ROLE_CHANGED, payload, correlationId);
  }

  // Audit Events
  async publishAuditLog(payload: AuditLogPayload, correlationId?: string): Promise<boolean> {
    return this.publish(Exchanges.AUDIT, 'audit.log', payload, correlationId);
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}
