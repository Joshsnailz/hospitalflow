import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as amqp from 'amqplib';
import { UserEntity } from '../users/entities/user.entity';

interface UserCreatedEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  correlationId: string;
  source: string;
  version: string;
  payload: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phoneNumber?: string;
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: string;
  };
}

interface UserActivatedEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  correlationId: string;
  source: string;
  version: string;
  payload: {
    userId: string;
    email: string;
  };
}

interface UserDeactivatedEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  correlationId: string;
  source: string;
  version: string;
  payload: {
    userId: string;
    email: string;
  };
}

@Injectable()
export class UserConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UserConsumerService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 5000;

  private readonly EXCHANGE = 'clinical.events';
  private readonly QUEUE_USER_CREATED = 'user-service.user.created';
  private readonly QUEUE_USER_ACTIVATED = 'user-service.user.activated';
  private readonly QUEUE_USER_DEACTIVATED = 'user-service.user.deactivated';

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

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

      // Ensure exchange exists
      await this.channel.assertExchange(this.EXCHANGE, 'topic', { durable: true });

      // Setup queues with DLX
      const queueOptions = {
        durable: true,
        deadLetterExchange: 'clinical.dlx',
        deadLetterRoutingKey: 'user-service.dead',
      };

      // User created queue
      await this.channel.assertQueue(this.QUEUE_USER_CREATED, queueOptions);
      await this.channel.bindQueue(this.QUEUE_USER_CREATED, this.EXCHANGE, 'user.created');

      // User activated queue
      await this.channel.assertQueue(this.QUEUE_USER_ACTIVATED, queueOptions);
      await this.channel.bindQueue(this.QUEUE_USER_ACTIVATED, this.EXCHANGE, 'user.activated');

      // User deactivated queue
      await this.channel.assertQueue(this.QUEUE_USER_DEACTIVATED, queueOptions);
      await this.channel.bindQueue(this.QUEUE_USER_DEACTIVATED, this.EXCHANGE, 'user.deactivated');

      // Set prefetch
      await this.channel.prefetch(10);

      // Start consuming
      await this.channel.consume(this.QUEUE_USER_CREATED, this.handleUserCreated.bind(this));
      await this.channel.consume(this.QUEUE_USER_ACTIVATED, this.handleUserActivated.bind(this));
      await this.channel.consume(this.QUEUE_USER_DEACTIVATED, this.handleUserDeactivated.bind(this));

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log('Connected to RabbitMQ and consuming user events');

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

  private async handleUserCreated(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const event: UserCreatedEvent = JSON.parse(msg.content.toString());
      this.logger.log(`Received user.created event for ${event.payload.email}`);

      // Check if user already exists (idempotency)
      const existingUser = await this.userRepository.findOne({
        where: { email: event.payload.email },
      });

      if (existingUser) {
        this.logger.log(`User ${event.payload.email} already exists, skipping`);
        this.channel?.ack(msg);
        return;
      }

      // Create user in user-service database
      const user = this.userRepository.create({
        id: event.payload.userId, // Use same ID for consistency
        email: event.payload.email,
        firstName: event.payload.firstName,
        lastName: event.payload.lastName,
        role: event.payload.role as any,
        phoneNumber: event.payload.phoneNumber || null,
        isActive: event.payload.isActive,
      });

      await this.userRepository.save(user);
      this.logger.log(`User synced: ${user.email} (${user.id})`);

      this.channel?.ack(msg);
    } catch (error) {
      this.logger.error('Error processing user.created event:', error);
      // Reject and requeue for retry
      this.channel?.nack(msg, false, true);
    }
  }

  private async handleUserActivated(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const event: UserActivatedEvent = JSON.parse(msg.content.toString());
      this.logger.log(`Received user.activated event for ${event.payload.email}`);

      await this.userRepository.update(
        { id: event.payload.userId },
        { isActive: true, deactivatedAt: null, deactivatedBy: null },
      );

      this.logger.log(`User activated in user-service: ${event.payload.email}`);
      this.channel?.ack(msg);
    } catch (error) {
      this.logger.error('Error processing user.activated event:', error);
      this.channel?.nack(msg, false, true);
    }
  }

  private async handleUserDeactivated(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const event: UserDeactivatedEvent = JSON.parse(msg.content.toString());
      this.logger.log(`Received user.deactivated event for ${event.payload.email}`);

      await this.userRepository.update(
        { id: event.payload.userId },
        { isActive: false, deactivatedAt: new Date() },
      );

      this.logger.log(`User deactivated in user-service: ${event.payload.email}`);
      this.channel?.ack(msg);
    } catch (error) {
      this.logger.error('Error processing user.deactivated event:', error);
      this.channel?.nack(msg, false, true);
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}
