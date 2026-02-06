import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncountersService } from '../encounters/encounters.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { DischargeService } from '../discharge/discharge.service';
import { ImagingService } from '../imaging/imaging.service';
import { ControlledDrugsService } from '../controlled-drugs/controlled-drugs.service';
import { EmergencyService } from '../emergency/emergency.service';
import { CarePlansService } from '../care-plans/care-plans.service';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
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
    private readonly appointmentsService: AppointmentsService,
    private readonly dischargeService: DischargeService,
    private readonly imagingService: ImagingService,
    private readonly controlledDrugsService: ControlledDrugsService,
    private readonly emergencyService: EmergencyService,
    private readonly carePlansService: CarePlansService,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(EncounterEntity)
    private readonly encounterRepository: Repository<EncounterEntity>,
    @InjectRepository(EmergencyVisitEntity)
    private readonly emergencyVisitRepository: Repository<EmergencyVisitEntity>,
    @InjectRepository(ControlledDrugEntryEntity)
    private readonly controlledDrugEntryRepository: Repository<ControlledDrugEntryEntity>,
  ) {}

  // ==================== Public API ====================

  async getAggregatedStats(userId?: string, role?: string): Promise<Record<string, unknown>> {
    if (role && ADMIN_ROLES.includes(role)) {
      return this.getAdminStats();
    }

    if (role && DOCTOR_ROLES.includes(role)) {
      return this.getDoctorStats(userId ?? '');
    }

    if (role === 'nurse') {
      return this.getNurseStats();
    }

    if (role && PHARMACIST_ROLES.includes(role)) {
      return this.getPharmacistStats();
    }

    // Fallback for prescriber or any other clinical role: return a
    // lightweight combined view from the existing sub-service stats.
    return this.getDefaultStats(userId, role);
  }

  // ==================== Admin / Clinical-Admin Stats ====================

  private async getAdminStats(): Promise<Record<string, unknown>> {
    const { today, tomorrow } = this.todayRange();

    const [
      totalPatientsRegistered,
      scheduledToday,
      checkedInToday,
      currentlyAdmitted,
      awaitingDischarge,
      dischargedToday,
      emergencyWaiting,
      emergencyBeingSeen,
      appointmentsCompletedToday,
      appointmentsCancelledToday,
      appointmentsNoShowToday,
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

      // scheduledToday: appointments scheduled or confirmed for today
      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.scheduledDate >= :today', { today })
        .andWhere('a.scheduledDate < :tomorrow', { tomorrow })
        .andWhere('a.status IN (:...statuses)', { statuses: ['scheduled', 'confirmed'] })
        .getCount(),

      // checkedInToday: appointments with status in_progress today
      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.scheduledDate >= :today', { today })
        .andWhere('a.scheduledDate < :tomorrow', { tomorrow })
        .andWhere('a.status = :status', { status: 'in_progress' })
        .getCount(),

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

      // appointmentsCompletedToday
      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.scheduledDate >= :today', { today })
        .andWhere('a.scheduledDate < :tomorrow', { tomorrow })
        .andWhere('a.status = :status', { status: 'completed' })
        .getCount(),

      // appointmentsCancelledToday
      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.scheduledDate >= :today', { today })
        .andWhere('a.scheduledDate < :tomorrow', { tomorrow })
        .andWhere('a.status = :status', { status: 'cancelled' })
        .getCount(),

      // appointmentsNoShowToday
      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.scheduledDate >= :today', { today })
        .andWhere('a.scheduledDate < :tomorrow', { tomorrow })
        .andWhere('a.status = :status', { status: 'no_show' })
        .getCount(),

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
        scheduledToday,
        checkedInToday,
        currentlyAdmitted,
        awaitingDischarge,
        dischargedToday,
      },
      emergency: {
        emergencyWaiting,
        emergencyBeingSeen,
      },
      appointments: {
        appointmentsCompletedToday,
        appointmentsCancelledToday,
        appointmentsNoShowToday,
      },
      discharge: dischargeStats,
      imaging: imagingStats,
      controlledDrugs: controlledDrugStats,
      carePlans: carePlanStats,
    };
  }

  // ==================== Doctor / Consultant Stats ====================

  private async getDoctorStats(userId: string): Promise<Record<string, unknown>> {
    const { today, tomorrow } = this.todayRange();

    const [
      myAppointmentsToday,
      patientsInProgress,
      activeEncounters,
      pendingDischarges,
      completedToday,
      carePlanStats,
    ] = await Promise.all([
      // myAppointmentsToday: all non-cancelled/rescheduled appointments today
      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.doctorId = :userId', { userId })
        .andWhere('a.scheduledDate >= :today', { today })
        .andWhere('a.scheduledDate < :tomorrow', { tomorrow })
        .andWhere('a.status NOT IN (:...excludeStatuses)', {
          excludeStatuses: ['cancelled', 'rescheduled'],
        })
        .getCount(),

      // patientsInProgress: doctor's in_progress appointments
      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.doctorId = :userId', { userId })
        .andWhere('a.status = :status', { status: 'in_progress' })
        .getCount(),

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

      // completedToday: appointments completed today by this doctor
      this.appointmentRepository
        .createQueryBuilder('a')
        .where('a.doctorId = :userId', { userId })
        .andWhere('a.scheduledDate >= :today', { today })
        .andWhere('a.scheduledDate < :tomorrow', { tomorrow })
        .andWhere('a.status = :status', { status: 'completed' })
        .getCount(),

      this.safeCall(() => this.carePlansService.getDashboardStats()),
    ]);

    return {
      role: 'doctor',
      myAppointmentsToday,
      patientsInProgress,
      activeEncounters,
      pendingDischarges,
      completedToday,
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

  private async getDefaultStats(userId?: string, role?: string): Promise<Record<string, unknown>> {
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
      this.safeCall(() => this.appointmentsService.getDashboardStats(userId, role)),
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
   * This allows the dashboard to degrade gracefully if a sub-service is
   * unavailable or throws an unexpected error.
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
