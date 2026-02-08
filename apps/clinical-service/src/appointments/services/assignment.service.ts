import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { AppointmentEntity } from '../entities';
import { firstValueFrom } from 'rxjs';

export type AssignmentStrategy = 'round-robin' | 'workload';

interface ClinicianInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  hospitalId: string;
  departmentId?: string;
  isActive: boolean;
}

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Auto-assign clinician using selected strategy
   */
  async autoAssignClinician(
    appointmentId: string,
    strategy: AssignmentStrategy = 'workload',
  ): Promise<{ clinicianId: string; clinicianName: string } | null> {
    this.logger.log(`Auto-assigning clinician for appointment ${appointmentId} using ${strategy} strategy`);

    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }

    let selectedClinician: ClinicianInfo | null = null;

    if (strategy === 'round-robin') {
      selectedClinician = await this.roundRobinAssign(
        appointment.hospitalId,
        appointment.departmentId,
      );
    } else if (strategy === 'workload') {
      selectedClinician = await this.workloadBasedAssign(
        appointment.hospitalId,
        appointment.departmentId,
        appointment.scheduledDate,
      );
    }

    if (!selectedClinician) {
      this.logger.warn(`No available clinicians found for assignment`);
      return null;
    }

    this.logger.log(`Selected clinician ${selectedClinician.id} (${selectedClinician.firstName} ${selectedClinician.lastName})`);

    return {
      clinicianId: selectedClinician.id,
      clinicianName: `${selectedClinician.firstName} ${selectedClinician.lastName}`,
    };
  }

  /**
   * Round-robin assignment strategy
   */
  private async roundRobinAssign(
    hospitalId: string,
    departmentId?: string | null,
  ): Promise<ClinicianInfo | null> {
    this.logger.log(`Using round-robin assignment for hospital ${hospitalId}`);

    // Get all active clinicians in hospital/department
    const clinicians = await this.getAvailableClinicians(hospitalId, departmentId);

    if (clinicians.length === 0) {
      return null;
    }

    // Get last assigned clinician
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.hospitalId = :hospitalId', { hospitalId })
      .andWhere('appointment.assignmentStatus != :status', { status: 'pending' })
      .andWhere('appointment.doctorId IS NOT NULL')
      .orderBy('appointment.assignedAt', 'DESC')
      .limit(1);

    if (departmentId) {
      queryBuilder.andWhere('appointment.departmentId = :departmentId', { departmentId });
    }

    const lastAssignment = await queryBuilder.getOne();

    // Find next clinician in rotation
    if (!lastAssignment || !lastAssignment.doctorId) {
      // No previous assignment, return first clinician
      return clinicians[0];
    }

    const lastIndex = clinicians.findIndex((c) => c.id === lastAssignment.doctorId);

    if (lastIndex === -1) {
      // Last assigned clinician not in current list, start from beginning
      return clinicians[0];
    }

    // Return next clinician in rotation
    const nextIndex = (lastIndex + 1) % clinicians.length;
    return clinicians[nextIndex];
  }

  /**
   * Workload-based assignment strategy
   */
  private async workloadBasedAssign(
    hospitalId: string,
    departmentId?: string | null,
    date?: Date,
  ): Promise<ClinicianInfo | null> {
    this.logger.log(`Using workload-based assignment for hospital ${hospitalId}`);

    // Get all active clinicians
    const clinicians = await this.getAvailableClinicians(hospitalId, departmentId);

    if (clinicians.length === 0) {
      return null;
    }

    // Count active assignments for each clinician
    const workloadCounts = new Map<string, number>();

    for (const clinician of clinicians) {
      const queryBuilder = this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.doctorId = :doctorId', { doctorId: clinician.id })
        .andWhere('appointment.assignmentStatus IN (:...statuses)', {
          statuses: ['assigned', 'accepted'],
        });

      if (date) {
        // Count appointments on the specific date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        queryBuilder
          .andWhere('appointment.scheduledDate >= :startDate', { startDate: startOfDay })
          .andWhere('appointment.scheduledDate <= :endDate', { endDate: endOfDay });
      }

      const count = await queryBuilder.getCount();
      workloadCounts.set(clinician.id, count);

      this.logger.debug(`Clinician ${clinician.id} has ${count} active appointments`);
    }

    // Sort clinicians by workload (ascending) and return clinician with least work
    const sortedClinicians = clinicians.sort(
      (a, b) => (workloadCounts.get(a.id) || 0) - (workloadCounts.get(b.id) || 0),
    );

    const selectedClinician = sortedClinicians[0];
    this.logger.log(
      `Selected clinician ${selectedClinician.id} with workload ${workloadCounts.get(selectedClinician.id)}`,
    );

    return selectedClinician;
  }

  /**
   * Get available clinicians from user-service
   */
  private async getAvailableClinicians(
    hospitalId: string,
    departmentId?: string | null,
  ): Promise<ClinicianInfo[]> {
    try {
      const params: any = {
        role: 'doctor,consultant,nurse,hospital_pharmacist,prescriber',
        isActive: true,
        hospitalId,
        limit: 200,
      };

      if (departmentId) {
        params.departmentId = departmentId;
      }

      this.logger.debug(`Fetching clinicians from user-service with params:`, params);

      const response = await firstValueFrom(
        this.httpService.get('/users', { params }),
      );

      if (!response.data?.success || !response.data?.data) {
        this.logger.warn('Invalid response from user-service');
        return [];
      }

      const clinicians: ClinicianInfo[] = response.data.data;

      this.logger.log(`Found ${clinicians.length} available clinicians`);

      return clinicians.filter((c) => c.isActive);
    } catch (error) {
      this.logger.error(`Error fetching clinicians from user-service:`, error.message);
      return [];
    }
  }

  /**
   * Get clinician name from user-service
   */
  async getClinicianName(clinicianId: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/users/${clinicianId}`),
      );

      if (!response.data?.success || !response.data?.data) {
        return 'Unknown Clinician';
      }

      const clinician = response.data.data;
      return `${clinician.firstName} ${clinician.lastName}`;
    } catch (error) {
      this.logger.error(`Error fetching clinician ${clinicianId}:`, error.message);
      return 'Unknown Clinician';
    }
  }

  /**
   * Check if clinician is active
   */
  async isClinicianActive(clinicianId: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/users/${clinicianId}`),
      );

      if (!response.data?.success || !response.data?.data) {
        return false;
      }

      return response.data.data.isActive === true;
    } catch (error) {
      this.logger.error(`Error checking clinician ${clinicianId} status:`, error.message);
      return false;
    }
  }
}
