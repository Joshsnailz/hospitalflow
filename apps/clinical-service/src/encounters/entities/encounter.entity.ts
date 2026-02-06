import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ClinicalNoteEntity } from './clinical-note.entity';
import { DischargeFormEntity } from '../../discharge/entities/discharge-form.entity';

export type EncounterStatus =
  | 'admitted'
  | 'in_treatment'
  | 'awaiting_discharge'
  | 'discharged'
  | 'deceased'
  | 'transferred';

export type EncounterType = 'inpatient' | 'outpatient' | 'emergency' | 'day_case';

@Entity('encounters')
@Index(['patientId'])
@Index(['admittingDoctorId'])
@Index(['status'])
@Index(['createdAt'])
export class EncounterEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'patient_chi', type: 'varchar', length: 11 })
  patientChi: string;

  @Column({ name: 'hospital_id', type: 'uuid' })
  hospitalId: string;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ name: 'ward_id', type: 'uuid', nullable: true })
  wardId: string | null;

  @Column({ name: 'bed_id', type: 'uuid', nullable: true })
  bedId: string | null;

  @Column({ name: 'admitting_doctor_id', type: 'uuid' })
  admittingDoctorId: string;

  @Column({ name: 'attending_doctor_id', type: 'uuid', nullable: true })
  attendingDoctorId: string | null;

  @Column({ type: 'varchar', length: 30, default: 'admitted' })
  status: EncounterStatus;

  @Column({ name: 'encounter_type', type: 'varchar', length: 50 })
  encounterType: EncounterType;

  @Column({ name: 'admission_date', type: 'timestamp' })
  admissionDate: Date;

  @Column({ name: 'discharge_date', type: 'timestamp', nullable: true })
  dischargeDate: Date | null;

  @Column({ name: 'chief_complaint', type: 'text', nullable: true })
  chiefComplaint: string | null;

  @Column({ name: 'admission_diagnosis', type: 'text', nullable: true })
  admissionDiagnosis: string | null;

  @Column({ name: 'discharge_diagnosis', type: 'text', nullable: true })
  dischargeDiagnosis: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => ClinicalNoteEntity, (note) => note.encounter)
  clinicalNotes: ClinicalNoteEntity[];

  @OneToOne(() => DischargeFormEntity, (form) => form.encounter)
  dischargeForm: DischargeFormEntity;
}
