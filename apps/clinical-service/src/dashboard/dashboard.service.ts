import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EncountersService } from '../encounters/encounters.service';
import { DischargeService } from '../discharge/discharge.service';
import { ImagingService } from '../imaging/imaging.service';
import { ControlledDrugsService } from '../controlled-drugs/controlled-drugs.service';
import { EmergencyService } from '../emergency/emergency.service';
import { CarePlansService } from '../care-plans/care-plans.service';
import { EncounterEntity } from '../encounters/entities/encounter.entity';
import { EmergencyVisitEntity } from '../emergency/entities/emergency-visit.entity';
import { ControlledDrugEntryEntity } from '../controlled-drugs/entities/controlled-drug-entry.entity';

/** Roles that receive admin-level dashboard metrics */
const ADMIN_ROLES = ['super_admin', 'clinical_admin'];

/** Roles that receive doctor-level dashboard metrics */
const DOCTOR_ROLES = ['doctor', 'consultant'];

/** Roles that receive pharmacist-level dashboard metrics */
const PHARMACIST_ROLES = ['hospital_pharmacist', 'pharmacy_technician'];

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly encountersService: EncountersService,
    private readonly dischargeService: DischargeService,
    private readonly imagingService: ImagingService,
    private readonly controlledDrugsService: ControlledDrugsService,
    private readonly emergencyService: EmergencyService,
    private readonly carePlansService: CarePlansService,
    private readonly httpService: HttpService,
    @InjectRepository(EncounterEntity)
    private readonly encounterRepository: Repository<EncounterEntity>,
    @InjectRepository(EmergencyVisitEntity)
    private readonly emergencyVisitRepository: Repository<EmergencyVisitEntity>,
    @InjectRepository(ControlledDrugEntryEntity)
    private readonly controlledDrugEntryRepository: Repository<ControlledDrugEntryEntity>,
  ) {}

  // ==================== Public API ====================

  async getAggregatedStats(userId?: string, role?: string, authHeader?: string): Promise<Record<string, unknown>> {
    if (role && ADMIN_ROLES.includes(role)) {
      return this.getAdminStats(authHeader);
    }

    if (role && DOCTOR_ROLES.includes(role)) {
      return this.getDoctorStats(userId ?? '', authHeader);
    }

    if (role === 'nurse') {
      return this.getNurseStats();
    }

    if (role && PHARMACIST_ROLES.includes(role)) {
      return this.getPharmacistStats();
    }

    return this.getDefaultStats(userId, role, authHeader);
  }

  // ==================== Admin / Clinical-Admin Stats ====================

  private async getAdminStats(authHeader?: string): Promise<Record<string, unknown>> {
    const { today, tomorrow } = this.todayRange();

    const [
      totalPatientsRegistered,
      currentlyAdmitted,
      awaitingDischarge,
      dischargedToday,
      emergencyWaiting,
      emergencyBeingSeen,
      appointmentStats,
      dischargeStats,
      imagingStats,
      controlledDrugStats,
      carePlanStats,
    ] = await Promise.all([
      // totalPatientsRegistered: unique patients across all encounters
      this.encounterRepository
        .createQueryBuilder('encounter')
        .select('COUNT(DISTINCT encounter.patient_id)', 'count')
        .getRawOne()
        .then((r) => parseInt(r?.count ?? '0', 10)),

      // currentlyAdmitted: encounters admitted or in_treatment
      this.encounterRepository
        .createQueryBuilder('e')
        .where('e.status IN (:...statuses)', { statuses: ['admitted', 'in_treatment'] })
        .getCount(),

      // awaitingDischarge
      this.encounterRepository
        .createQueryBuilder('e')
        .where('e.status = :status', { status: 'awaiting_discharge' })
        .getCount(),

      // dischargedToday
      this.encounterRepository
        .createQueryBuilder('e')
        .where('e.dischargeDate >= :today', { today })
        .andWhere('e.dischargeDate < :tomorrow', { tomorrow })
        .getCount(),

      // emergencyWaiting: waiting or triaged
      this.emergencyVisitRepository
        .createQueryBuilder('v')
        .where('v.status IN (:...statuses)', { statuses: ['waiting', 'triaged'] })
        .getCount(),

      // emergencyBeingSeen
      this.emergencyVisitRepository
        .createQueryBuilder('v')
        .where('v.status = :status', { status: 'being_seen' })
        .getCount(),

      // Appointment stats from appointment-service via HTTP
      this.fetchAppointmentStats(undefined, 'admin', authHeader),

      // Supplementary sub-service stats
      this.safeCall(() => this.dischargeService.getDashboardStats()),
      this.safeCall(() => this.imagingService.getDashboardStats()),
      this.safeCall(() => this.controlledDrugsService.getDashboardStats()),
      this.safeCall(() => this.carePlansService.getDashboardStats()),
    ]);

    return {
      role: 'admin',
      patientFlow: {
        totalPatientsRegistered,
        scheduledToday: appointmentStats?.totalToday ?? 0,
        checkedInToday: appointmentStats?.checkedInToday ?? 0,
        currentlyAdmitted,
        awaitingDischarge,
        dischargedToday,
      },
      emergency: {
        emergencyWaiting,
        emergencyBeingSeen,
      },
      appointments: {
        appointmentsCompletedToday: appointmentStats?.completedToday ?? 0,
        appointmentsCancelledToday: appointmentStats?.cancelledToday ?? 0,
        appointmentsNoShowToday: appointmentStats?.noShowToday ?? 0,
        pendingAcceptance: appointmentStats?.pendingAcceptance ?? 0,
        pendingReschedule: appointmentStats?.pendingReschedule ?? 0,
      },
      discharge: dischargeStats,
      imaging: imagingStats,
      controlledDrugs: controlledDrugStats,
      carePlans: carePlanStats,
    };
  }

  // ==================== Doctor / Consultant Stats ====================

  private async getDoctorStats(userId: string, authHeader?: string): Promise<Record<string, unknown>> {
    const [
      activeEncounters,
      pendingDischarges,
      appointmentStats,
      carePlanStats,
    ] = await Promise.all([
      // activeEncounters: doctor's encounters that are not discharged/deceased
      this.encounterRepository
        .createQueryBuilder('e')
        .where(
          '(e.admittingDoctorId = :userId OR e.attendingDoctorId = :userId)',
          { userId },
        )
        .andWhere('e.status NOT IN (:...statuses)', {
          statuses: ['discharged', 'deceased'],
        })
        .getCount(),

      // pendingDischarges: doctor's encounters awaiting_discharge
      this.encounterRepository
        .createQueryBuilder('e')
        .where(
          '(e.admittingDoctorId = :userId OR e.attendingDoctorId = :userId)',
          { userId },
        )
        .andWhere('e.status = :status', { status: 'awaiting_discharge' })
        .getCount(),

      // Appointment stats from appointment-service via HTTP
      this.fetchAppointmentStats(userId, 'doctor', authHeader),

      this.safeCall(() => this.carePlansService.getDashboardStats()),
    ]);

    return {
      role: 'doctor',
      myAppointmentsToday: appointmentStats?.todayAppointments ?? 0,
      patientsInProgress: appointmentStats?.patientsInProgress ?? 0,
      activeEncounters,
      pendingDischarges,
      completedToday: appointmentStats?.completedToday ?? 0,
      pendingAcceptance: appointmentStats?.pendingAcceptance ?? 0,
      carePlans: carePlanStats,
    };
  }

  // ==================== Nurse Stats ====================

  private async getNurseStats(): Promise<Record<string, unknown>> {
    const { today, tomorrow } = this.todayRange();

    const [
      patientsInWard,
      admissionsToday,
      dischargesToday,
      pendingAssessments,
      carePlanStats,
    ] = await Promise.all([
      // patientsInWard: encounters admitted/in_treatment with a wardId
      this.encounterRepository
        .createQueryBuilder('e')
        .where('e.status IN (:...statuses)', {
          statuses: ['admitted', 'in_treatment'],
        })
        .andWhere('e.wardId IS NOT NULL')
        .getCount(),

      // admissionsToday
      this.encounterRepository
        .createQueryBuilder('e')
        .where('e.admissionDate >= :today', { today })
        .andWhere('e.admissionDate < :tomorrow', { tomorrow })
        .getCount(),

      // dischargesToday
      this.encounterRepository
        .createQueryBuilder('e')
        .where('e.dischargeDate >= :today', { today })
        .andWhere('e.dischargeDate < :tomorrow', { tomorrow })
        .getCount(),

      // pendingAssessments: encounters in admitted status (not yet in_treatment)
      this.encounterRepository
        .createQueryBuilder('e')
        .where('e.status = :status', { status: 'admitted' })
        .getCount(),

      this.safeCall(() => this.carePlansService.getDashboardStats()),
    ]);

    return {
      role: 'nurse',
      patientsInWard,
      admissionsToday,
      dischargesToday,
      pendingAssessments,
      carePlans: carePlanStats,
    };
  }

  // ==================== Pharmacist Stats ====================

  private async getPharmacistStats(): Promise<Record<string, unknown>> {
    const { today, tomorrow } = this.todayRange();

    const [
      pendingPharmacyReviews,
      controlledDrugEntriesToday,
      dischargeStats,
      controlledDrugStats,
    ] = await Promise.all([
      // pendingPharmacyReviews: encounters awaiting_discharge
      this.encounterRepository
        .createQueryBuilder('e')
        .where('e.status = :status', { status: 'awaiting_discharge' })
        .getCount(),

      // controlledDrugEntriesToday
      this.controlledDrugEntryRepository
        .createQueryBuilder('entry')
        .where('entry.administeredAt >= :today', { today })
        .andWhere('entry.administeredAt < :tomorrow', { tomorrow })
        .getCount(),

      this.safeCall(() => this.dischargeService.getDashboardStats()),
      this.safeCall(() => this.controlledDrugsService.getDashboardStats()),
    ]);

    return {
      role: 'pharmacist',
      pendingPharmacyReviews,
      controlledDrugEntriesToday,
      discharge: dischargeStats,
      controlledDrugs: controlledDrugStats,
    };
  }

  // ==================== Default / Fallback Stats ====================

  private async getDefaultStats(userId?: string, role?: string, authHeader?: string): Promise<Record<string, unknown>> {
    const [
      encounterStats,
      appointmentStats,
      dischargeStats,
      imagingStats,
      controlledDrugStats,
      emergencyStats,
      carePlanStats,
    ] = await Promise.all([
      this.safeCall(() => this.encountersService.getDashboardStats(userId, role)),
      this.fetchAppointmentStats(userId, role, authHeader),
      this.safeCall(() => this.dischargeService.getDashboardStats(role)),
      this.safeCall(() => this.imagingService.getDashboardStats()),
      this.safeCall(() => this.controlledDrugsService.getDashboardStats()),
      this.safeCall(() => this.emergencyService.getDashboardStats()),
      this.safeCall(() => this.carePlansService.getDashboardStats()),
    ]);

    return {
      role: role ?? 'unknown',
      encounters: encounterStats,
      appointments: appointmentStats,
      discharge: dischargeStats,
      imaging: imagingStats,
      controlledDrugs: controlledDrugStats,
      emergency: emergencyStats,
      carePlans: carePlanStats,
    };
  }

  // ==================== Helpers ====================

  /**
   * Fetches appointment dashboard stats from the appointment-service via HTTP.
   */
  private async fetchAppointmentStats(
    userId?: string,
    role?: string,
    authHeader?: string,
  ): Promise<Record<string, any>> {
    try {
      const params: Record<string, string> = {};
      if (userId) params.userId = userId;
      if (role) params.role = role;

      const headers: Record<string, string> = {};
      if (authHeader) headers.Authorization = authHeader;

      const response = await firstValueFrom(
        this.httpService.get('/appointments/dashboard/stats', {
          params,
          headers,
        }),
      );

      return response.data?.data ?? response.data ?? {};
    } catch (error) {
      this.logger.warn(
        `Failed to fetch appointment stats from appointment-service: ${(error as Error)?.message ?? error}`,
      );
      return {};
    }
  }

  /**
   * Returns the start of today and start of tomorrow as ISO strings
   * for use in date range queries.
   */
  private todayRange(): { today: string; tomorrow: string } {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    return {
      today: todayDate.toISOString(),
      tomorrow: tomorrowDate.toISOString(),
    };
  }

  /**
   * Safely calls an async function and returns an empty object on failure.
   */
  private async safeCall<T>(fn: () => Promise<T>): Promise<T | Record<string, never>> {
    try {
      return await fn();
    } catch (error) {
      this.logger.warn(
        `Dashboard sub-service call failed: ${error?.message ?? error}`,
      );
      return {};
    }
  }
}
