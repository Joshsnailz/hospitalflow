import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type AvailabilityStatus = 'available' | 'offline' | 'busy' | 'away';

@Entity('clinician_availability')
@Index(['clinicianId'], { unique: true })
@Index(['status'])
@Index(['hospitalId'])
export class ClinicianAvailabilityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'clinician_id', type: 'uuid', unique: true })
  clinicianId: string;

  @Column({ name: 'clinician_name', type: 'varchar', length: 200 })
  clinicianName: string;

  @Column({ name: 'clinician_role', type: 'varchar', length: 50 })
  clinicianRole: string;

  @Column({ type: 'varchar', length: 20, default: 'offline' })
  status: AvailabilityStatus;

  @Column({ name: 'hospital_id', type: 'uuid', nullable: true })
  hospitalId: string | null;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ name: 'last_status_change', type: 'timestamp', nullable: true })
  lastStatusChange: Date | null;

  @Column({ name: 'blocked_slots', type: 'jsonb', default: '[]' })
  blockedSlots: Array<{ appointmentId: string; start: string; end: string }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
