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

export type AllergyType = 'drug' | 'food' | 'environmental' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening' | 'unknown';
export type AllergyStatus = 'active' | 'inactive' | 'resolved';

@Entity('patient_allergies')
@Index(['patientId'])
@Index(['allergyType'])
@Index(['severity'])
export class PatientAllergyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'allergen_name', type: 'varchar', length: 255 })
  allergenName: string;

  @Column({ name: 'allergy_type', type: 'varchar', length: 20, default: 'other' })
  allergyType: AllergyType;

  @Column({ type: 'varchar', length: 20, default: 'unknown' })
  severity: AllergySeverity;

  @Column({ type: 'text', nullable: true })
  reaction: string | null;

  @Column({ name: 'onset_date', type: 'date', nullable: true })
  onsetDate: Date | null;

  @Column({ name: 'diagnosed_date', type: 'date', nullable: true })
  diagnosedDate: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  diagnosedBy: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: AllergyStatus;

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

  @ManyToOne(() => PatientEntity, (patient) => patient.allergies)
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;
}
