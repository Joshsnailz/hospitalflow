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
import { HospitalEntity } from './hospital.entity';
import { WardEntity } from './ward.entity';

@Entity('departments')
@Index(['hospitalId', 'name'], { unique: true })
export class DepartmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  hospitalId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'clinical' })
  departmentType: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true })
  headOfDepartmentId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => HospitalEntity, (hospital) => hospital.departments)
  @JoinColumn({ name: 'hospitalId' })
  hospital: HospitalEntity;

  @OneToMany(() => WardEntity, (ward) => ward.department)
  wards: WardEntity[];
}
