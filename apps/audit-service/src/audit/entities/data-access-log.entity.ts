import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type DataAccessType = 'VIEW' | 'DOWNLOAD' | 'PRINT' | 'EXPORT' | 'SHARE';

export type DataSensitivity = 'PHI' | 'PII' | 'FINANCIAL' | 'GENERAL';

@Entity('data_access_logs')
@Index(['userId'])
@Index(['patientId'])
@Index(['dataType'])
@Index(['accessType'])
@Index(['createdAt'])
@Index(['sensitivity'])
export class DataAccessLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'user_email', type: 'varchar', length: 255 })
  userEmail: string;

  @Column({ name: 'user_role', type: 'varchar', length: 50 })
  userRole: string;

  @Column({ name: 'patient_id', type: 'uuid', nullable: true })
  patientId: string | null;

  @Column({ name: 'patient_mrn', type: 'varchar', length: 50, nullable: true })
  patientMrn: string | null;

  @Column({ name: 'data_type', type: 'varchar', length: 100 })
  dataType: string;

  @Column({ name: 'access_type', type: 'varchar', length: 20 })
  accessType: DataAccessType;

  @Column({ type: 'varchar', length: 20, default: 'PHI' })
  sensitivity: DataSensitivity;

  @Column({ name: 'record_id', type: 'varchar', length: 100, nullable: true })
  recordId: string | null;

  @Column({ name: 'record_type', type: 'varchar', length: 100, nullable: true })
  recordType: string | null;

  @Column({ name: 'access_reason', type: 'varchar', length: 500, nullable: true })
  accessReason: string | null;

  @Column({ name: 'fields_accessed', type: 'jsonb', nullable: true })
  fieldsAccessed: string[] | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true })
  requestId: string | null;

  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true })
  sessionId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'emergency_access', type: 'boolean', default: false })
  emergencyAccess: boolean;

  @Column({ name: 'break_glass_reason', type: 'text', nullable: true })
  breakGlassReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
