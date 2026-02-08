import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { EncounterEntity } from '../../encounters/entities/encounter.entity';

export type DischargeFormStatus = 'active' | 'completed' | 'cancelled';

@Entity('discharge_forms')
@Index(['encounterId'])
@Index(['patientId'])
@Index(['status'])
export class DischargeFormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'encounter_id', type: 'uuid', nullable: true })
  encounterId: string | null;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'patient_chi', type: 'varchar', length: 11, nullable: true })
  patientChi: string | null;

  @Column({ name: 'patient_name', type: 'varchar', length: 200, nullable: true })
  patientName: string | null;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status: DischargeFormStatus;

  // Vitals on discharge section
  @Column({ name: 'vitals', type: 'jsonb', nullable: true })
  vitalSignsOnDischarge: {
    bp?: string;
    hr?: string;
    temp?: string;
    spo2?: string;
    rr?: string;
    weight?: string;
    height?: string;
  } | null;

  @Column({ name: 'vitals_recorded_by', type: 'uuid', nullable: true })
  vitalsRecordedBy: string | null;

  @Column({ name: 'vitals_recorded_at', type: 'timestamp', nullable: true })
  vitalsRecordedAt: Date | null;

  // Clinical section
  @Column({ name: 'discharge_diagnosis', type: 'text', nullable: true })
  primaryDiagnosis: string | null;

  @Column({ name: 'secondary_diagnoses', type: 'jsonb', nullable: true })
  secondaryDiagnoses: string[] | null;

  @Column({ name: 'clinical_summary', type: 'text', nullable: true })
  clinicalSummary: string | null;

  @Column({ name: 'treatment_plan', type: 'text', nullable: true })
  treatmentProvided: string | null;

  @Column({ name: 'discharge_type', type: 'varchar', length: 50, nullable: true })
  dischargeType: string | null;

  @Column({ name: 'clinical_completed_by', type: 'uuid', nullable: true })
  clinicalCompletedBy: string | null;

  @Column({ name: 'clinical_completed_at', type: 'timestamp', nullable: true })
  clinicalCompletedAt: Date | null;

  // Pharmacy section
  @Column({ name: 'discharge_medications', type: 'jsonb', nullable: true })
  medicationsOnDischarge: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: string;
    instructions: string;
  }> | null;

  @Column({ name: 'medication_reconciliation_notes', type: 'text', nullable: true })
  pharmacyNotes: string | null;

  @Column({ name: 'pharmacy_completed_by', type: 'uuid', nullable: true })
  pharmacyCompletedBy: string | null;

  @Column({ name: 'pharmacy_completed_at', type: 'timestamp', nullable: true })
  pharmacyCompletedAt: Date | null;

  // Operations/Procedures section
  @Column({ name: 'procedures_performed', type: 'jsonb', nullable: true })
  operationsAndProcedures: Array<{
    name: string;
    date: string;
    surgeon: string;
    notes: string;
    outcome: string;
  }> | null;

  @Column({ name: 'operations_notes', type: 'text', nullable: true })
  surgeonNotes: string | null;

  @Column({ name: 'operations_completed_by', type: 'uuid', nullable: true })
  operationsCompletedBy: string | null;

  @Column({ name: 'operations_completed_at', type: 'timestamp', nullable: true })
  operationsCompletedAt: Date | null;

  // Nursing section
  @Column({ name: 'nursing_notes', type: 'text', nullable: true })
  nursingNotes: string | null;

  @Column({ name: 'nursing_assessment', type: 'text', nullable: true })
  nursingAssessment: string | null;

  @Column({ name: 'dietary_instructions', type: 'text', nullable: true })
  dietaryInstructions: string | null;

  @Column({ name: 'activity_restrictions', type: 'text', nullable: true })
  activityRestrictions: string | null;

  @Column({ name: 'nursing_completed_by', type: 'uuid', nullable: true })
  nursingCompletedBy: string | null;

  @Column({ name: 'nursing_completed_at', type: 'timestamp', nullable: true })
  nursingCompletedAt: Date | null;

  // Follow-up section
  @Column({ name: 'follow_up_instructions', type: 'text', nullable: true })
  followUpInstructions: string | null;

  @Column({ name: 'follow_up_date', type: 'date', nullable: true })
  followUpDate: Date | null;

  @Column({ name: 'follow_up_doctor', type: 'varchar', length: 200, nullable: true })
  followUpDoctor: string | null;

  @Column({ name: 'patient_education', type: 'text', nullable: true })
  patientEducation: string | null;

  // Final discharge
  @Column({ name: 'discharged_by', type: 'uuid', nullable: true })
  dischargedBy: string | null;

  @Column({ name: 'discharged_at', type: 'timestamp', nullable: true })
  dischargedAt: Date | null;

  @Column({ name: 'last_updated_by', type: 'uuid', nullable: true })
  lastUpdatedBy: string | null;

  @Column({ name: 'last_updated_section', type: 'varchar', length: 50, nullable: true })
  lastUpdatedSection: string | null;

  // Optimistic locking
  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => EncounterEntity, (encounter) => encounter.dischargeForm)
  @JoinColumn({ name: 'encounter_id' })
  encounter: EncounterEntity;
}
