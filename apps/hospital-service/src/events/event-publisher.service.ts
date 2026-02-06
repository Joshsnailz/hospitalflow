import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

export const EventRoutingKeys = {
  HOSPITAL_UPDATED: 'hospital.updated',
  DEPARTMENT_UPDATED: 'department.updated',
  WARD_UPDATED: 'ward.updated',
  BED_STATUS_CHANGED: 'bed.status.changed',
  AUDIT_LOG: 'audit.log',
} as const;

export const Exchanges = {
  EVENTS: 'clinical.events',
  AUDIT: 'clinical.audit',
} as const;

export interface HospitalUpdatedPayload {
  hospitalId: string;
  name: string;
  changes: Record<string, { old: any; new: any }>;
}

export interface DepartmentUpdatedPayload {
  departmentId: string;
  hospitalId: string;
  name: string;
  changes: Record<string, { old: any; new: any }>;
}

export interface WardUpdatedPayload {
  wardId: string;
  departmentId: string;
  name: string;
  changes: Record<string, { old: any; new: any }>;
}

export interface BedStatusChangedPayload {
  bedId: string;
  wardId: string;
  bedNumber: string;
  oldStatus: string;
  newStatus: string;
  patientId?: string;
}

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
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

      await ch.assertExchange(Exchanges.EVENTS, 'topic', { durable: true });
      await ch.assertExchange(Exchanges.AUDIT, 'direct', { durable: true });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log('Connected to RabbitMQ');

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
        source: 'hospital-service',
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

  async publishHospitalUpdated(
    payload: HospitalUpdatedPayload,
    correlationId?: string,
  ): Promise<boolean> {
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.HOSPITAL_UPDATED, payload, correlationId);
  }

  async publishDepartmentUpdated(
    payload: DepartmentUpdatedPayload,
    correlationId?: string,
  ): Promise<boolean> {
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.DEPARTMENT_UPDATED, payload, correlationId);
  }

  async publishWardUpdated(
    payload: WardUpdatedPayload,
    correlationId?: string,
  ): Promise<boolean> {
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.WARD_UPDATED, payload, correlationId);
  }

  async publishBedStatusChanged(
    payload: BedStatusChangedPayload,
    correlationId?: string,
  ): Promise<boolean> {
    return this.publish(Exchanges.EVENTS, EventRoutingKeys.BED_STATUS_CHANGED, payload, correlationId);
  }

  async publishAuditLog(
    payload: {
      userId?: string;
      action: string;
      resource: string;
      resourceId?: string;
      status: 'success' | 'failure';
    },
    correlationId?: string,
  ): Promise<boolean> {
    return this.publish(Exchanges.AUDIT, 'audit.log', payload, correlationId);
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}
