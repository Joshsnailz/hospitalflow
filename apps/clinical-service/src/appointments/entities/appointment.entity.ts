import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type AppointmentType =
  | 'consultation'
  | 'follow_up'
  | 'check_up'
  | 'emergency'
  | 'referral'
  | 'lab_review'
  | 'imaging'
  | 'imaging_review'
  | 'nursing_assessment'
  | 'procedure';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
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
export class AppointmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'patient_chi', type: 'varchar', length: 11, nullable: true })
  patientChi: string | null;

  @Column({ name: 'patient_name', type: 'varchar', length: 200, nullable: true })
  patientName: string | null;

  @Column({ name: 'doctor_id', type: 'uuid', nullable: true })
  doctorId: string | null;

  @Column({ name: 'doctor_name', type: 'varchar', length: 200, nullable: true })
  doctorName: string | null;

  @Column({ name: 'hospital_id', type: 'uuid', nullable: true })
  hospitalId: string | null;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

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

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
