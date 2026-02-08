import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AppointmentEntity } from '../entities';
import { ClinicalEventPublisherService } from '../../events/event-publisher.service';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    private readonly eventPublisher: ClinicalEventPublisherService,
  ) {}

  /**
   * Add appointment to queue and assign queue position
   */
  async addToQueue(
    appointmentId: string,
    hospitalId: string,
    departmentId?: string | null,
  ): Promise<number> {
    this.logger.log(`Adding appointment ${appointmentId} to queue for hospital ${hospitalId}`);

    const queuePosition = await this.getNextQueuePosition(hospitalId, departmentId);

    await this.appointmentRepository.update(appointmentId, {
      queuePosition,
      assignmentStatus: 'pending',
    });

    this.logger.log(`Appointment ${appointmentId} assigned queue position ${queuePosition}`);

    // Audit log for queue addition
    this.eventPublisher.publishAuditLog({
      action: 'UPDATE',
      resource: 'appointment_queue',
      resourceId: appointmentId,
      status: 'success',
      details: `Added to queue at position ${queuePosition} for hospital ${hospitalId}${departmentId ? `, department ${departmentId}` : ''}`,
    });

    return queuePosition;
  }

  /**
   * Get next available queue position for hospital/department
   */
  async getNextQueuePosition(
    hospitalId: string,
    departmentId?: string | null,
  ): Promise<number> {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.hospitalId = :hospitalId', { hospitalId })
      .andWhere('appointment.assignmentStatus = :status', { status: 'pending' })
      .orderBy('appointment.queuePosition', 'DESC')
      .limit(1);

    if (departmentId) {
      queryBuilder.andWhere('appointment.departmentId = :departmentId', { departmentId });
    } else {
      queryBuilder.andWhere('appointment.departmentId IS NULL');
    }

    const lastInQueue = await queryBuilder.getOne();

    return (lastInQueue?.queuePosition || 0) + 1;
  }

  /**
   * Get all queued appointments for hospital/department
   */
  async getQueuedAppointments(
    hospitalId: string,
    departmentId?: string | null,
  ): Promise<AppointmentEntity[]> {
    this.logger.log(`Fetching queued appointments for hospital ${hospitalId}`);

    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.hospitalId = :hospitalId', { hospitalId })
      .andWhere('appointment.assignmentStatus = :status', { status: 'pending' })
      .orderBy('appointment.queuePosition', 'ASC');

    if (departmentId) {
      queryBuilder.andWhere('appointment.departmentId = :departmentId', { departmentId });
    }

    const queuedAppointments = await queryBuilder.getMany();

    this.logger.log(`Found ${queuedAppointments.length} appointments in queue`);

    return queuedAppointments;
  }

  /**
   * Remove appointment from queue (after assignment)
   */
  async removeFromQueue(appointmentId: string): Promise<void> {
    this.logger.log(`Removing appointment ${appointmentId} from queue`);

    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      this.logger.warn(`Appointment ${appointmentId} not found`);
      return;
    }

    // Clear queue position
    await this.appointmentRepository.update(appointmentId, {
      queuePosition: null,
    });

    // Audit log for queue removal
    this.eventPublisher.publishAuditLog({
      action: 'UPDATE',
      resource: 'appointment_queue',
      resourceId: appointmentId,
      status: 'success',
      details: `Removed from queue (was at position ${appointment.queuePosition}) for hospital ${appointment.hospitalId}`,
    });

    // Reorder remaining appointments in the same queue
    await this.reorderQueue(appointment.hospitalId, appointment.departmentId);
  }

  /**
   * Reorder queue positions after removal
   */
  async reorderQueue(hospitalId: string, departmentId?: string | null): Promise<void> {
    this.logger.log(`Reordering queue for hospital ${hospitalId}`);

    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.hospitalId = :hospitalId', { hospitalId })
      .andWhere('appointment.assignmentStatus = :status', { status: 'pending' })
      .andWhere('appointment.queuePosition IS NOT NULL')
      .orderBy('appointment.queuePosition', 'ASC');

    if (departmentId) {
      queryBuilder.andWhere('appointment.departmentId = :departmentId', { departmentId });
    } else {
      queryBuilder.andWhere('appointment.departmentId IS NULL');
    }

    const queuedAppointments = await queryBuilder.getMany();

    // Update queue positions sequentially
    for (let i = 0; i < queuedAppointments.length; i++) {
      const appointment = queuedAppointments[i];
      const newPosition = i + 1;

      if (appointment.queuePosition !== newPosition) {
        await this.appointmentRepository.update(appointment.id, {
          queuePosition: newPosition,
        });
      }
    }

    this.logger.log(`Reordered ${queuedAppointments.length} appointments in queue`);
  }

  /**
   * Get queue count for hospital/department
   */
  async getQueueCount(hospitalId: string, departmentId?: string | null): Promise<number> {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.hospitalId = :hospitalId', { hospitalId })
      .andWhere('appointment.assignmentStatus = :status', { status: 'pending' });

    if (departmentId) {
      queryBuilder.andWhere('appointment.departmentId = :departmentId', { departmentId });
    }

    return queryBuilder.getCount();
  }
}
