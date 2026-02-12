import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RescheduleRequestEntity } from './entities/reschedule-request.entity';
import { ResolveRescheduleRequestDto } from './dto/resolve-reschedule-request.dto';
import { AppointmentEventPublisherService } from '../events/event-publisher.service';
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class RescheduleRequestsService {
  private readonly logger = new Logger(RescheduleRequestsService.name);

  constructor(
    @InjectRepository(RescheduleRequestEntity)
    private readonly rescheduleRequestRepository: Repository<RescheduleRequestEntity>,
    private readonly eventPublisher: AppointmentEventPublisherService,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async create(
    appointmentId: string,
    reason: string,
    currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
    type: 'reschedule' | 'cancel' = 'reschedule',
  ): Promise<RescheduleRequestEntity> {
    const requestedByName = currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.email;

    const request = this.rescheduleRequestRepository.create({
      appointmentId,
      requestedById: currentUser.id,
      requestedByName,
      requestedByRole: currentUser.role,
      reason,
      type,
    });

    const saved = await this.rescheduleRequestRepository.save(request);

    this.eventPublisher.publishAuditLog({
      userId: currentUser.id,
      action: type === 'cancel' ? 'cancel_request.created' : 'reschedule_request.created',
      resource: 'reschedule_request',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }

  async findPending(): Promise<RescheduleRequestEntity[]> {
    return this.rescheduleRequestRepository.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
    });
  }

  async findByAppointment(appointmentId: string): Promise<RescheduleRequestEntity[]> {
    return this.rescheduleRequestRepository.find({
      where: { appointmentId },
      order: { createdAt: 'DESC' },
    });
  }

  async resolve(
    id: string,
    dto: ResolveRescheduleRequestDto,
    currentUser: { id: string; email: string; role: string },
  ): Promise<RescheduleRequestEntity> {
    const request = await this.rescheduleRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Reschedule request with ID ${id} not found`);
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(`Reschedule request is already ${request.status}`);
    }

    request.status = dto.resolution === 'approved' ? 'approved' : 'rejected';
    request.resolvedById = currentUser.id;
    request.resolvedAt = new Date();
    request.resolutionNotes = dto.notes || null;

    if (dto.resolution === 'approved' && dto.newDate) {
      request.newDate = new Date(dto.newDate);
    }

    const saved = await this.rescheduleRequestRepository.save(request);

    // Handle approved cancel requests — actually cancel the appointment
    if (dto.resolution === 'approved' && request.type === 'cancel') {
      await this.appointmentsService.cancel(
        request.appointmentId,
        request.reason,
        currentUser.id,
      );
    }

    this.eventPublisher.publishAuditLog({
      userId: currentUser.id,
      action: `reschedule_request.${dto.resolution}`,
      resource: 'reschedule_request',
      resourceId: saved.id,
      status: 'success',
    });

    return saved;
  }
}
