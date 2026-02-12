import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('round_robin_trackers')
@Index(['hospitalId', 'departmentId'], { unique: true })
export class RoundRobinTrackerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hospital_id', type: 'uuid' })
  hospitalId: string;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ name: 'clinician_order', type: 'jsonb', default: '[]' })
  clinicianOrder: string[];

  @Column({ name: 'current_index', type: 'int', default: 0 })
  currentIndex: number;

  @Column({ name: 'last_assigned_clinician_id', type: 'uuid', nullable: true })
  lastAssignedClinicianId: string | null;

  @Column({ name: 'last_assigned_at', type: 'timestamp', nullable: true })
  lastAssignedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
