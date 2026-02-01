import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserRole, ROLES } from '../../config/roles.config';

export { UserRole } from '../../config/roles.config';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['role'])
@Index(['isActive'])
@Index(['createdAt'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 50, default: ROLES.DOCTOR })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({ length: 100, nullable: true })
  department: string | null;

  @Column({ name: 'employee_id', length: 50, nullable: true })
  employeeId: string | null;

  @Column({ length: 200, nullable: true })
  specialization: string | null;

  @Column({ name: 'license_number', length: 50, nullable: true })
  licenseNumber: string | null;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @Column({ name: 'deactivated_at', type: 'timestamp', nullable: true })
  deactivatedAt: Date | null;

  @Column({ name: 'deactivated_by', type: 'uuid', nullable: true })
  deactivatedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
