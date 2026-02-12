import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type RescheduleRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

@Entity('reschedule_requests')
@Index(['appointmentId'])
@Index(['status'])
export class RescheduleRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId: string;

  @Column({ name: 'requested_by_id', type: 'uuid' })
  requestedById: string;

  @Column({ name: 'requested_by_name', type: 'varchar', length: 200 })
  requestedByName: string;

  @Column({ name: 'requested_by_role', type: 'varchar', length: 50 })
  requestedByRole: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', length: 20, default: 'reschedule' })
  type: 'reschedule' | 'cancel';

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: RescheduleRequestStatus;

  @Column({ name: 'resolved_by_id', type: 'uuid', nullable: true })
  resolvedById: string | null;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'new_date', type: 'timestamp', nullable: true })
  newDate: Date | null;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
