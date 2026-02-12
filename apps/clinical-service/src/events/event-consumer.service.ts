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

  // Queue names scoped to this service
  private readonly QUEUE_PATIENT_UPDATED = 'clinical-service.patient.updated';
  private readonly QUEUE_PATIENT_DEACTIVATED = 'clinical-service.patient.deactivated';
  private readonly QUEUE_USER_UPDATED = 'clinical-service.user.updated';
  private readonly QUEUE_USER_DEACTIVATED = 'clinical-service.user.deactivated';
  private readonly QUEUE_BED_STATUS_CHANGED = 'clinical-service.bed.status.changed';

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
        deadLetterRoutingKey: 'clinical-service.dead',
      };

      // Patient updated
      await ch.assertQueue(this.QUEUE_PATIENT_UPDATED, queueOptions);
      await ch.bindQueue(this.QUEUE_PATIENT_UPDATED, this.EXCHANGE, 'patient.updated');

      // Patient deactivated
      await ch.assertQueue(this.QUEUE_PATIENT_DEACTIVATED, queueOptions);
      await ch.bindQueue(this.QUEUE_PATIENT_DEACTIVATED, this.EXCHANGE, 'patient.deactivated');

      // User updated (doctor/nurse name changes)
      await ch.assertQueue(this.QUEUE_USER_UPDATED, queueOptions);
      await ch.bindQueue(this.QUEUE_USER_UPDATED, this.EXCHANGE, 'user.updated');

      // User deactivated
      await ch.assertQueue(this.QUEUE_USER_DEACTIVATED, queueOptions);
      await ch.bindQueue(this.QUEUE_USER_DEACTIVATED, this.EXCHANGE, 'user.deactivated');

      // Bed status changed
      await ch.assertQueue(this.QUEUE_BED_STATUS_CHANGED, queueOptions);
      await ch.bindQueue(this.QUEUE_BED_STATUS_CHANGED, this.EXCHANGE, 'bed.status.changed');

      await ch.prefetch(10);

      // Start consuming
      await ch.consume(this.QUEUE_PATIENT_UPDATED, this.handlePatientUpdated.bind(this));
      await ch.consume(this.QUEUE_PATIENT_DEACTIVATED, this.handlePatientDeactivated.bind(this));
      await ch.consume(this.QUEUE_USER_UPDATED, this.handleUserUpdated.bind(this));
      await ch.consume(this.QUEUE_USER_DEACTIVATED, this.handleUserDeactivated.bind(this));
      await ch.consume(this.QUEUE_BED_STATUS_CHANGED, this.handleBedStatusChanged.bind(this));

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

  /**
   * When a patient is updated, cascade name/CHI changes to all clinical entities
   * that store denormalized patient data.
   */
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
        // Update patientChi across all clinical entities that store it
        // (appointments are handled by the appointment-service's own event consumer)
        if (changes.chiNumber) {
          const newChi = chiNumber;
          await queryRunner.query(
            `UPDATE encounters SET patient_chi = $1 WHERE patient_id = $2`,
            [newChi, patientId],
          );
          await queryRunner.query(
            `UPDATE discharge_forms SET patient_chi = $1 WHERE patient_id = $2`,
            [newChi, patientId],
          );
          await queryRunner.query(
            `UPDATE imaging_requests SET patient_chi = $1 WHERE patient_id = $2`,
            [newChi, patientId],
          );
          await queryRunner.query(
            `UPDATE controlled_drug_entries SET patient_chi = $1 WHERE patient_id = $2`,
            [newChi, patientId],
          );
          await queryRunner.query(
            `UPDATE emergency_visits SET patient_chi = $1 WHERE patient_id = $2`,
            [newChi, patientId],
          );
          await queryRunner.query(
            `UPDATE care_plans SET patient_chi = $1 WHERE patient_id = $2`,
            [newChi, patientId],
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

  /**
   * When a patient is deactivated, log the event.
   * Appointment cancellation is handled by the appointment-service's own event consumer.
   */
  private async handlePatientDeactivated(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const event: EventWrapper = JSON.parse(msg.content.toString());
      const { patientId } = event.payload;
      this.logger.log(`Received patient.deactivated event for patient ${patientId}`);

      // Appointment cancellation is now handled by the appointment-service
      // Clinical-service only needs to handle its own entities if needed

      this.channel?.ack(msg);
    } catch (error) {
      this.logger.error('Error processing patient.deactivated event:', error);
      this.channel?.nack(msg, false, true);
    }
  }

  /**
   * When a user (doctor/nurse) is updated, cascade name changes to all clinical
   * entities that store denormalized user names.
   */
  private async handleUserUpdated(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const event: EventWrapper = JSON.parse(msg.content.toString());
      const { userId, changes } = event.payload;
      this.logger.log(`Received user.updated event for user ${userId}`);

      // Only cascade if name-related fields changed
      const nameChanged = changes?.firstName || changes?.lastName;
      if (!nameChanged) {
        this.channel?.ack(msg);
        return;
      }

      // We need to build the new full name from the changes
      const newFirstName = changes?.firstName?.new;
      const newLastName = changes?.lastName?.new;

      // We can only update if we know both parts of the name.
      // If only one changed, we need to query for the other part from any existing record.
      let fullName: string | null = null;

      if (newFirstName && newLastName) {
        fullName = `${newFirstName} ${newLastName}`;
      } else {
        // Try to get existing name from an emergency visit to derive the full name
        const existing = await this.dataSource.query(
          `SELECT attending_doctor_name FROM emergency_visits WHERE attending_doctor_id = $1 LIMIT 1`,
          [userId],
        );

        if (existing.length > 0) {
          const currentName = existing[0].attending_doctor_name;
          if (currentName) {
            const parts = currentName.split(' ');
            if (newFirstName) {
              fullName = `${newFirstName} ${parts.slice(1).join(' ')}`;
            } else if (newLastName) {
              fullName = `${parts[0]} ${newLastName}`;
            }
          }
        }
      }

      if (fullName) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          // Appointment doctor_name updates are handled by the appointment-service's own event consumer

          // Update attendingDoctorName in emergency visits
          await queryRunner.query(
            `UPDATE emergency_visits SET attending_doctor_name = $1 WHERE attending_doctor_id = $2`,
            [fullName, userId],
          );

          // Update triagedByName in emergency visits
          await queryRunner.query(
            `UPDATE emergency_visits SET triaged_by_name = $1 WHERE triaged_by_id = $2`,
            [fullName, userId],
          );

          // Update authorName in clinical notes
          await queryRunner.query(
            `UPDATE clinical_notes SET author_name = $1 WHERE author_id = $2`,
            [fullName, userId],
          );

          // Update requestedByName in imaging requests
          await queryRunner.query(
            `UPDATE imaging_requests SET requested_by_name = $1 WHERE requested_by_id = $2`,
            [fullName, userId],
          );

          // Update reportedByName in imaging requests
          await queryRunner.query(
            `UPDATE imaging_requests SET reported_by_name = $1 WHERE reported_by_id = $2`,
            [fullName, userId],
          );

          // Update administeredByName in controlled drug entries
          await queryRunner.query(
            `UPDATE controlled_drug_entries SET administered_by_name = $1 WHERE administered_by_id = $2`,
            [fullName, userId],
          );

          // Update witnessName in controlled drug entries
          await queryRunner.query(
            `UPDATE controlled_drug_entries SET witness_name = $1 WHERE witness_id = $2`,
            [fullName, userId],
          );

          // Update createdByName in care plans
          await queryRunner.query(
            `UPDATE care_plans SET created_by_name = $1 WHERE created_by_id = $2`,
            [fullName, userId],
          );

          // Update reviewedByName in care plans
          await queryRunner.query(
            `UPDATE care_plans SET reviewed_by_name = $1 WHERE reviewed_by_id = $2`,
            [fullName, userId],
          );

          await queryRunner.commitTransaction();
          this.logger.log(`User name cascaded across clinical entities for user ${userId}`);
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

  /**
   * When a user (doctor) is deactivated, log the event.
   * Appointment cancellation is handled by the appointment-service's own event consumer.
   */
  private async handleUserDeactivated(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const event: EventWrapper = JSON.parse(msg.content.toString());
      const { userId } = event.payload;
      this.logger.log(`Received user.deactivated event for user ${userId}`);

      // Appointment cancellation is now handled by the appointment-service

      this.channel?.ack(msg);
    } catch (error) {
      this.logger.error('Error processing user.deactivated event:', error);
      this.channel?.nack(msg, false, true);
    }
  }

  /**
   * When a bed status changes, update the corresponding encounter if a patient
   * is being admitted or discharged from a bed.
   */
  private async handleBedStatusChanged(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const event: EventWrapper = JSON.parse(msg.content.toString());
      const { bedId, newStatus, patientId } = event.payload;
      this.logger.log(`Received bed.status.changed event for bed ${bedId}`);

      if (newStatus === 'occupied' && patientId) {
        // Update active encounter for this patient to reference this bed
        await this.dataSource.query(
          `UPDATE encounters SET bed_id = $1 WHERE patient_id = $2 AND status IN ('admitted', 'in_treatment')`,
          [bedId, patientId],
        );
      } else if (newStatus === 'available') {
        // Clear bed reference from any encounter that had this bed
        await this.dataSource.query(
          `UPDATE encounters SET bed_id = NULL WHERE bed_id = $1 AND status IN ('admitted', 'in_treatment')`,
          [bedId],
        );
      }

      this.channel?.ack(msg);
    } catch (error) {
      this.logger.error('Error processing bed.status.changed event:', error);
      this.channel?.nack(msg, false, true);
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}
