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

export type MedicalAidStatus = 'active' | 'expired' | 'suspended' | 'cancelled';

@Entity('patient_medical_aid')
@Index(['patientId'])
@Index(['membershipNumber'])
@Index(['status'])
export class PatientMedicalAidEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'provider_name', type: 'varchar', length: 200 })
  providerName: string;

  @Column({ name: 'plan_name', type: 'varchar', length: 200, nullable: true })
  planName: string | null;

  @Column({ name: 'membership_number', type: 'varchar', length: 100 })
  membershipNumber: string;

  @Column({ name: 'group_number', type: 'varchar', length: 100, nullable: true })
  groupNumber: string | null;

  @Column({ name: 'policy_holder_name', type: 'varchar', length: 200, nullable: true })
  policyHolderName: string | null;

  @Column({ name: 'policy_holder_relationship', type: 'varchar', length: 50, nullable: true })
  policyHolderRelationship: string | null;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate: Date | null;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: MedicalAidStatus;

  @Column({ name: 'is_primary', default: true })
  isPrimary: boolean;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

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

  @ManyToOne(() => PatientEntity, (patient) => patient.medicalAid)
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;
}
