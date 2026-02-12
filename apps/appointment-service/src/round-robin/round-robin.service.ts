import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { RoundRobinTrackerEntity } from './entities/round-robin-tracker.entity';
import { AvailabilityService } from '../availability/availability.service';

@Injectable()
export class RoundRobinService {
  private readonly logger = new Logger(RoundRobinService.name);

  constructor(
    @InjectRepository(RoundRobinTrackerEntity)
    private readonly trackerRepository: Repository<RoundRobinTrackerEntity>,
    private readonly availabilityService: AvailabilityService,
    private readonly httpService: HttpService,
  ) {}

  async getNextClinician(
    hospitalId: string,
    departmentId?: string,
    authHeader?: string,
  ): Promise<{ clinicianId: string; clinicianName: string } | null> {
    // Get or create tracker for this hospital+department
    let tracker = await this.trackerRepository.findOne({
      where: {
        hospitalId,
        departmentId: departmentId || null as any,
      },
    });

    if (!tracker) {
      tracker = this.trackerRepository.create({
        hospitalId,
        departmentId: departmentId || null,
        clinicianOrder: [],
        currentIndex: 0,
      });
    }

    // Refresh clinician list if empty
    if (tracker.clinicianOrder.length === 0 && authHeader) {
      try {
        const response = await firstValueFrom(
          this.httpService.get('/auth/clinicians', {
            headers: { Authorization: authHeader },
          }),
        );

        const clinicians = response.data?.data;
        if (clinicians && clinicians.length > 0) {
          tracker.clinicianOrder = clinicians.map((c: any) => c.id);
        }
      } catch (err) {
        this.logger.warn('Failed to fetch clinicians from auth-service for round-robin', (err as Error)?.message);
      }
    }

    if (tracker.clinicianOrder.length === 0) {
      return null;
    }

    // Get available clinicians
    const available = await this.availabilityService.getAvailable(hospitalId, departmentId);
    const availableIds = new Set(available.map((a) => a.clinicianId));

    // Find next available clinician in rotation
    const totalClinicians = tracker.clinicianOrder.length;
    let startIndex = tracker.currentIndex % totalClinicians;

    for (let i = 0; i < totalClinicians; i++) {
      const candidateIndex = (startIndex + i) % totalClinicians;
      const candidateId = tracker.clinicianOrder[candidateIndex];

      // If availability tracking has clinicians, respect it; otherwise fall through
      if (availableIds.size === 0 || availableIds.has(candidateId)) {
        // Find the clinician name
        const availRecord = available.find((a) => a.clinicianId === candidateId);
        const clinicianName = availRecord?.clinicianName || 'Assigned Clinician';

        // Advance index
        tracker.currentIndex = (candidateIndex + 1) % totalClinicians;
        tracker.lastAssignedClinicianId = candidateId;
        tracker.lastAssignedAt = new Date();
        await this.trackerRepository.save(tracker);

        return { clinicianId: candidateId, clinicianName };
      }
    }

    // No available clinician found, assign the next in rotation anyway
    const fallbackId = tracker.clinicianOrder[startIndex];
    tracker.currentIndex = (startIndex + 1) % totalClinicians;
    tracker.lastAssignedClinicianId = fallbackId;
    tracker.lastAssignedAt = new Date();
    await this.trackerRepository.save(tracker);

    return { clinicianId: fallbackId, clinicianName: 'Assigned Clinician' };
  }
}
