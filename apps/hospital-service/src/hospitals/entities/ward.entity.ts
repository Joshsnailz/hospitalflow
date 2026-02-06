import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { DepartmentEntity } from './department.entity';
import { BedEntity } from './bed.entity';

@Entity('wards')
@Index(['departmentId', 'name'], { unique: true })
export class WardEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  departmentId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'general' })
  wardType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  floor: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  building: string | null;

  @Column({ type: 'int', default: 0 })
  totalBeds: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nurseStationPhone: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => DepartmentEntity, (department) => department.wards)
  @JoinColumn({ name: 'departmentId' })
  department: DepartmentEntity;

  @OneToMany(() => BedEntity, (bed) => bed.ward)
  beds: BedEntity[];
}
