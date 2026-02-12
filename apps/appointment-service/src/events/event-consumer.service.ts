import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as amqp from 'amqplib';

interface EventWrapper {
  eventId: string;
  eventType: string;
  timestamp: string;
  correlationId: string;
  source: string;
  version: string;
  payload: any;
}

@Injectable()
export class EventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventConsumerService.name);
  private connection: any = null;
  private channel: amqp.Channel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 5000;

  private readonly EXCHANGE = 'clinical.events';

  private readonly QUEUE_PATIENT_UPDATED = 'appointment-service.patient.updated';
  private readonly QUEUE_PATIENT_DEACTIVATED = 'appointment-service.patient.deactivated';
  private readonly QUEUE_USER_UPDATED = 'appointment-service.user.updated';
  private readonly QUEUE_USER_DEACTIVATED = 'appointment-service.user.deactivated';

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
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
      const conn = await amqp.connect(rabbitmqUrl);
      this.connection = conn;
      const ch = await conn.createChannel();
      this.channel = ch;

      await ch.assertExchange(this.EXCHANGE, 'topic', { durable: true });

      const queueOptions: amqp.Options.AssertQueue = {
        durable: true,
        deadLetterExchange: 'clinical.dlx',
        deadLetterRoutingKey: 'appointment-service.dead',
      };

      await ch.assertQueue(this.QUEUE_PATIENT_UPDATED, queueOptions);
      await ch.bindQueue(this.QUEUE_PATIENT_UPDATED, this.EXCHANGE, 'patient.updated');

      await ch.assertQueue(this.QUEUE_PATIENT_DEACTIVATED, queueOptions);
      await ch.bindQueue(this.QUEUE_PATIENT_DEACTIVATED, this.EXCHANGE, 'patient.deactivated');

      await ch.assertQueue(this.QUEUE_USER_UPDATED, queueOptions);
      await ch.bindQueue(this.QUEUE_USER_UPDATED, this.EXCHANGE, 'user.updated');

      await ch.assertQueue(this.QUEUE_USER_DEACTIVATED, queueOptions);
      await ch.bindQueue(this.QUEUE_USER_DEACTIVATED, this.EXCHANGE, 'user.deactivated');

      await ch.prefetch(10);

      await ch.consume(this.QUEUE_PATIENT_UPDATED, this.handlePatientUpdated.bind(this));
      await ch.consume(this.QUEUE_PATIENT_DEACTIVATED, this.handlePatientDeactivated.bind(this));
      await ch.consume(this.QUEUE_USER_UPDATED, this.handleUserUpdated.bind(this));
      await ch.consume(this.QUEUE_USER_DEACTIVATED, this.handleUserDeactivated.bind(this));

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log('Connected to RabbitMQ and consuming events');

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

  private async handlePatientUpdated(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const event: EventWrapper = JSON.parse(msg.content.toString());
      const { patientId, chiNumber, firstName, lastName, changes } = event.payload;
      this.logger.log(`Received patient.updated event for patient ${patientId}`);

      const fullName = `${firstName} ${lastName}`;
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        if (changes.firstName || changes.lastName) {
          await queryRunner.query(
            `UPDATE appointments SET patient_name = $1 WHERE patient_id = $2`,
            [fullName, patientId],
          );
        }

        if (changes.chiNumber) {
          await queryRunner.query(
            `UPDATE appointments SET patient_chi = $1 WHERE patient_id = $2`,
            [chiNumber, patientId],
          );
        }

        await queryRunner.commitTransaction();
        this.logger.log(`Patient data cascaded for patient ${patientId}`);
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }

      this.channel?.ack(msg);
    } catch (error) {
      this.logger.error('Error processing patient.updated event:', error);
      this.channel?.nack(msg, false, true);
    }
  }

  private async handlePatientDeactivated(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const event: EventWrapper = JSON.parse(msg.content.toString());
      const { patientId } = event.payload;
      this.logger.log(`Received patient.deactivated event for patient ${patientId}`);

      await this.dataSource.query(
        `UPDATE appointments SET status = 'cancelled', notes = COALESCE(notes, '') || ' [Auto-cancelled: patient deactivated]'
         WHERE patient_id = $1 AND status IN ('scheduled', 'confirmed', 'pending_acceptance')`,
        [patientId],
      );

      this.logger.log(`Cancelled pending appointments for deactivated patient ${patientId}`);
      this.channel?.ack(msg);
    } catch (error) {
      this.logger.error('Error processing patient.deactivated event:', error);
      this.channel?.nack(msg, false, true);
    }
  }

  private async handleUserUpdated(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const event: EventWrapper = JSON.parse(msg.content.toString());
      const { userId, changes } = event.payload;
      this.logger.log(`Received user.updated event for user ${userId}`);

      const nameChanged = changes?.firstName || changes?.lastName;
      if (!nameChanged) {
        this.channel?.ack(msg);
        return;
      }

      const newFirstName = changes?.firstName?.new;
      const newLastName = changes?.lastName?.new;

      let fullName: string | null = null;

      if (newFirstName && newLastName) {
        fullName = `${newFirstName} ${newLastName}`;
      } else {
        const existing = await this.dataSource.query(
          `SELECT doctor_name FROM appointments WHERE doctor_id = $1 LIMIT 1`,
          [userId],
        );

        if (existing.length > 0) {
          const currentName = existing[0].doctor_name;
          const parts = currentName.split(' ');
          if (newFirstName) {
            fullName = `${newFirstName} ${parts.slice(1).join(' ')}`;
          } else if (newLastName) {
            fullName = `${parts[0]} ${newLastName}`;
          }
        }
      }

      if (fullName) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          await queryRunner.query(
            `UPDATE appointments SET doctor_name = $1 WHERE doctor_id = $2`,
            [fullName, userId],
          );

          await queryRunner.query(
            `UPDATE clinician_availability SET clinician_name = $1 WHERE clinician_id = $2`,
            [fullName, userId],
          );

          await queryRunner.query(
            `UPDATE reschedule_requests SET requested_by_name = $1 WHERE requested_by_id = $2`,
            [fullName, userId],
          );

          await queryRunner.commitTransaction();
          this.logger.log(`User name cascaded across appointment entities for user ${userId}`);
        } catch (err) {
          await queryRunner.rollbackTransaction();
          throw err;
        } finally {
          await queryRunner.release();
        }
      }

      this.channel?.ack(msg);
    } catch (error) {
      this.logger.error('Error processing user.updated event:', error);
      this.channel?.nack(msg, false, true);
    }
  }

  private async handleUserDeactivated(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const event: EventWrapper = JSON.parse(msg.content.toString());
      const { userId } = event.payload;
      this.logger.log(`Received user.deactivated event for user ${userId}`);

      await this.dataSource.query(
        `UPDATE appointments SET status = 'cancelled', notes = COALESCE(notes, '') || ' [Auto-cancelled: doctor deactivated]'
         WHERE doctor_id = $1 AND status IN ('scheduled', 'confirmed', 'pending_acceptance')`,
        [userId],
      );

      await this.dataSource.query(
        `UPDATE clinician_availability SET status = 'offline' WHERE clinician_id = $1`,
        [userId],
      );

      this.logger.log(`Cancelled pending appointments for deactivated doctor ${userId}`);
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
