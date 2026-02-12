import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicianAvailabilityEntity } from './entities/clinician-availability.entity';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(
    @InjectRepository(ClinicianAvailabilityEntity)
    private readonly availabilityRepository: Repository<ClinicianAvailabilityEntity>,
  ) {}

  async updateStatus(
    dto: UpdateAvailabilityDto,
    currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
  ): Promise<ClinicianAvailabilityEntity> {
    let record = await this.availabilityRepository.findOne({
      where: { clinicianId: currentUser.id },
    });

    const clinicianName = currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.email;

    if (!record) {
      record = this.availabilityRepository.create({
        clinicianId: currentUser.id,
        clinicianName,
        clinicianRole: currentUser.role,
        status: dto.status,
        hospitalId: dto.hospitalId || null,
        departmentId: dto.departmentId || null,
        lastStatusChange: new Date(),
      });
    } else {
      record.status = dto.status;
      record.clinicianName = clinicianName;
      record.clinicianRole = currentUser.role;
      record.lastStatusChange = new Date();
      if (dto.hospitalId !== undefined) record.hospitalId = dto.hospitalId || null;
      if (dto.departmentId !== undefined) record.departmentId = dto.departmentId || null;
    }

    return this.availabilityRepository.save(record);
  }

  async getAvailable(hospitalId?: string, departmentId?: string): Promise<ClinicianAvailabilityEntity[]> {
    const queryBuilder = this.availabilityRepository
      .createQueryBuilder('availability')
      .where('availability.status = :status', { status: 'available' });

    if (hospitalId) {
      queryBuilder.andWhere('availability.hospitalId = :hospitalId', { hospitalId });
    }

    if (departmentId) {
      queryBuilder.andWhere('availability.departmentId = :departmentId', { departmentId });
    }

    return queryBuilder.getMany();
  }

  async getAll(): Promise<ClinicianAvailabilityEntity[]> {
    return this.availabilityRepository.find({
      order: { clinicianName: 'ASC' },
    });
  }

  async getMyAvailability(clinicianId: string): Promise<ClinicianAvailabilityEntity | null> {
    return this.availabilityRepository.findOne({
      where: { clinicianId },
    });
  }

  async blockSlot(
    clinicianId: string,
    appointmentId: string,
    start: string,
    end: string,
  ): Promise<void> {
    const record = await this.availabilityRepository.findOne({
      where: { clinicianId },
    });

    if (record) {
      const slots = record.blockedSlots || [];
      slots.push({ appointmentId, start, end });
      record.blockedSlots = slots;
      await this.availabilityRepository.save(record);
    }
  }

  async releaseSlot(clinicianId: string, appointmentId: string): Promise<void> {
    const record = await this.availabilityRepository.findOne({
      where: { clinicianId },
    });

    if (record) {
      record.blockedSlots = (record.blockedSlots || []).filter(
        (slot) => slot.appointmentId !== appointmentId,
      );
      await this.availabilityRepository.save(record);
    }
  }
}
