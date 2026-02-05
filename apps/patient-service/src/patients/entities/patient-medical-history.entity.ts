import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PatientEntity } from './patient.entity';

export type MedicalHistoryType =
  | 'condition'
  | 'surgery'
  | 'hospitalization'
  | 'family_history'
  | 'immunization'
  | 'other';

export type MedicalHistoryStatus = 'active' | 'resolved' | 'chronic' | 'unknown';

@Entity('patient_medical_history')
@Index(['patientId'])
@Index(['type'])
@Index(['status'])
export class PatientMedicalHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ type: 'varchar', length: 30, default: 'condition' })
  type: MedicalHistoryType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'icd_code', type: 'varchar', length: 20, nullable: true })
  icdCode: string | null;

  @Column({ name: 'onset_date', type: 'date', nullable: true })
  onsetDate: Date | null;

  @Column({ name: 'resolution_date', type: 'date', nullable: true })
  resolutionDate: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'unknown' })
  status: MedicalHistoryStatus;

  @Column({ type: 'varchar', length: 200, nullable: true })
  diagnosedBy: string | null;

  @Column({ name: 'treatment_notes', type: 'text', nullable: true })
  treatmentNotes: string | null;

  @Column({ name: 'family_member_relation', type: 'varchar', length: 50, nullable: true })
  familyMemberRelation: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => PatientEntity, (patient) => patient.medicalHistory)
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;
}
