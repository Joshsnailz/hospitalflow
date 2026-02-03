import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'APPROVE'
  | 'REJECT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'PERMISSION_CHANGE'
  | 'ROLE_CHANGE'
  | 'ACCESS_DENIED';

export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'PARTIAL';

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['resource'])
@Index(['createdAt'])
@Index(['status'])
@Index(['ipAddress'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'user_email', type: 'varchar', length: 255, nullable: true })
  userEmail: string | null;

  @Column({ name: 'user_role', type: 'varchar', length: 50, nullable: true })
  userRole: string | null;

  @Column({ type: 'varchar', length: 50 })
  action: AuditAction;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resource: string | null;

  @Column({ name: 'resource_id', type: 'varchar', length: 100, nullable: true })
  resourceId: string | null;

  @Column({ type: 'varchar', length: 20, default: 'SUCCESS' })
  status: AuditStatus;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: Record<string, any> | null;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true })
  requestId: string | null;

  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true })
  sessionId: string | null;

  @Column({ name: 'service_name', type: 'varchar', length: 50, nullable: true })
  serviceName: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
