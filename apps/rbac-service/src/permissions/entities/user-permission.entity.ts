import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { PermissionEntity } from './permission.entity';

export type UserPermissionType = 'grant' | 'deny';

@Entity('user_permissions')
@Unique(['userId', 'permissionId'])
@Index(['userId'])
@Index(['permissionId'])
export class UserPermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'permission_id', type: 'uuid' })
  permissionId: string;

  @Column({ type: 'varchar', length: 10, default: 'grant' })
  type: UserPermissionType;

  @Column({ name: 'granted_by', type: 'uuid', nullable: true })
  grantedBy: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @ManyToOne(() => PermissionEntity, (permission) => permission.userPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: PermissionEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
