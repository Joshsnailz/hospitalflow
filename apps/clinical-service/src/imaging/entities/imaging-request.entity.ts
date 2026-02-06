import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type ImagingType = 'xray' | 'ct_scan' | 'mri' | 'ultrasound' | 'mammogram' | 'fluoroscopy';

export type ImagingUrgency = 'stat' | 'urgent' | 'routine';

export type ImagingStatus = 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

@Entity('imaging_requests')
@Index(['patientId'])
@Index(['status'])
@Index(['requestedAt'])
export class ImagingRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'patient_chi', type: 'varchar', length: 11 })
  patientChi: string;

  @Column({ name: 'encounter_id', type: 'uuid', nullable: true })
  encounterId: string | null;

  @Column({ name: 'requested_by_id', type: 'uuid' })
  requestedById: string;

  @Column({ name: 'requested_by_name', type: 'varchar', length: 200 })
  requestedByName: string;

  @Column({ name: 'imaging_type', type: 'varchar', length: 50 })
  imagingType: ImagingType;

  @Column({ name: 'body_part', type: 'varchar', length: 100 })
  bodyPart: string;

  @Column({ name: 'clinical_indication', type: 'text' })
  clinicalIndication: string;

  @Column({ type: 'varchar', length: 20, default: 'routine' })
  urgency: ImagingUrgency;

  @Column({ type: 'varchar', length: 30, default: 'requested' })
  status: ImagingStatus;

  @Column({ name: 'scheduled_date', type: 'timestamp', nullable: true })
  scheduledDate: Date | null;

  @Column({ name: 'completed_date', type: 'timestamp', nullable: true })
  completedDate: Date | null;

  @Column({ type: 'text', nullable: true })
  results: string | null;

  @Column({ name: 'report_url', type: 'varchar', length: 500, nullable: true })
  reportUrl: string | null;

  @Column({ name: 'reported_by_id', type: 'uuid', nullable: true })
  reportedById: string | null;

  @Column({ name: 'reported_by_name', type: 'varchar', length: 200, nullable: true })
  reportedByName: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'requested_at', type: 'timestamp', default: () => 'NOW()' })
  requestedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
