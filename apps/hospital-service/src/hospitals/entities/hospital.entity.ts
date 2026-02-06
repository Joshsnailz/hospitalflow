import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DepartmentEntity } from './department.entity';

@Entity('hospitals')
export class HospitalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, default: 'hospital' })
  facilityType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressLine1: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressLine2: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  province: string | null;

  @Column({ type: 'varchar', length: 100, default: 'Zimbabwe' })
  country: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phonePrimary: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneEmergency: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => DepartmentEntity, (department) => department.hospital)
  departments: DepartmentEntity[];
}
