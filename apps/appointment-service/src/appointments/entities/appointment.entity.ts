import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type AppointmentScenario = 'emergency' | 'walk_in' | 'scheduled';

export type AppointmentType =
  | 'consultation'
  | 'follow_up'
  | 'check_up'
  | 'emergency'
  | 'referral'
  | 'lab_review'
  | 'imaging'
  | 'nursing_assessment'
  | 'walk_in';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'pending_acceptance'
  | 'pending_reschedule'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export type AppointmentPriority = 'urgent' | 'high' | 'normal' | 'low';

@Entity('appointments')
@Index(['patientId'])
@Index(['doctorId'])
@Index(['scheduledDate'])
@Index(['status'])
@Index(['scenario'])
export class AppointmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid', nullable: true })
  patientId: string | null;

  @Column({ name: 'patient_chi', type: 'varchar', length: 11, nullable: true })
  patientChi: string | null;

  @Column({ name: 'patient_name', type: 'varchar', length: 200, nullable: true })
  patientName: string | null;

  @Column({ name: 'doctor_id', type: 'uuid', nullable: true })
  doctorId: string | null;

  @Column({ name: 'doctor_name', type: 'varchar', length: 200, nullable: true })
  doctorName: string | null;

  @Column({ name: 'hospital_id', type: 'uuid' })
  hospitalId: string;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ name: 'scenario', type: 'varchar', length: 20, default: 'scheduled' })
  scenario: AppointmentScenario;

  @Column({ name: 'appointment_type', type: 'varchar', length: 50 })
  appointmentType: AppointmentType;

  @Column({ name: 'scheduled_date', type: 'timestamp' })
  scheduledDate: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date | null;

  @Column({ name: 'duration_minutes', type: 'int', default: 30 })
  durationMinutes: number;

  @Column({ type: 'varchar', length: 30, default: 'scheduled' })
  status: AppointmentStatus;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority: AppointmentPriority;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'referred_by_id', type: 'uuid', nullable: true })
  referredById: string | null;

  @Column({ name: 'auto_assigned', type: 'boolean', default: false })
  autoAssigned: boolean;

  @Column({ name: 'is_emergency_unknown', type: 'boolean', default: false })
  isEmergencyUnknown: boolean;

  @Column({ name: 'emergency_alias', type: 'varchar', length: 100, nullable: true })
  emergencyAlias: string | null;

  @Column({ name: 'emergency_conditions', type: 'text', nullable: true })
  emergencyConditions: string | null;

  @Column({ name: 'preferred_clinician_id', type: 'uuid', nullable: true })
  preferredClinicianId: string | null;

  @Column({ name: 'preferred_clinician_name', type: 'varchar', length: 200, nullable: true })
  preferredClinicianName: string | null;

  @Column({ name: 'accepted_by_id', type: 'uuid', nullable: true })
  acceptedById: string | null;

  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
