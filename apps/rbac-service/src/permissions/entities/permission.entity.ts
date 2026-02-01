import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { ResourceEntity } from '../../resources/entities/resource.entity';
import { ActionEntity } from '../../actions/entities/action.entity';
import { RolePermissionEntity } from './role-permission.entity';
import { UserPermissionEntity } from './user-permission.entity';

export type PermissionScope = 'all' | 'own' | 'department' | 'assigned';

@Entity('permissions')
@Unique(['resourceId', 'actionId', 'scope'])
@Index(['isActive'])
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resource_id', type: 'uuid' })
  resourceId: string;

  @Column({ name: 'action_id', type: 'uuid' })
  actionId: string;

  @Column({ type: 'varchar', length: 20, default: 'all' })
  scope: PermissionScope;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'display_name', type: 'varchar', length: 150 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => ResourceEntity, (resource) => resource.permissions)
  @JoinColumn({ name: 'resource_id' })
  resource: ResourceEntity;

  @ManyToOne(() => ActionEntity, (action) => action.permissions)
  @JoinColumn({ name: 'action_id' })
  action: ActionEntity;

  @OneToMany(() => RolePermissionEntity, (rp) => rp.permission)
  rolePermissions: RolePermissionEntity[];

  @OneToMany(() => UserPermissionEntity, (up) => up.permission)
  userPermissions: UserPermissionEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
