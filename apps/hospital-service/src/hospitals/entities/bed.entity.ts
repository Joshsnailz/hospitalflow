import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { WardEntity } from './ward.entity';

@Entity('beds')
@Index(['wardId', 'bedNumber'], { unique: true })
export class BedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  wardId: string;

  @Column({ type: 'varchar', length: 20 })
  bedNumber: string;

  @Column({ type: 'varchar', length: 50, default: 'standard' })
  bedType: string;

  @Column({ type: 'varchar', length: 20, default: 'available' })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  currentPatientId: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => WardEntity, (ward) => ward.beds)
  @JoinColumn({ name: 'wardId' })
  ward: WardEntity;
}
