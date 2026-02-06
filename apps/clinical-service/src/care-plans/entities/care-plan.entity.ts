import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type CarePlanStatus = 'active' | 'completed' | 'suspended' | 'cancelled';

@Entity('care_plans')
@Index(['patientId'])
@Index(['status'])
@Index(['reviewDate'])
export class CarePlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'patient_chi', type: 'varchar', length: 11 })
  patientChi: string;

  @Column({ name: 'encounter_id', type: 'uuid', nullable: true })
  encounterId: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  goals: Array<{
    goal: string;
    targetDate: string;
    status: string;
  }> | null;

  @Column({ type: 'jsonb', nullable: true })
  interventions: Array<{
    intervention: string;
    frequency: string;
    responsibleRole: string;
    notes: string;
  }> | null;

  @Column({ name: 'review_date', type: 'date', nullable: true })
  reviewDate: Date | null;

  @Column({ name: 'reviewed_by_id', type: 'uuid', nullable: true })
  reviewedById: string | null;

  @Column({ name: 'reviewed_by_name', type: 'varchar', length: 200, nullable: true })
  reviewedByName: string | null;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status: CarePlanStatus;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority: string;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById: string;

  @Column({ name: 'created_by_name', type: 'varchar', length: 200 })
  createdByName: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
