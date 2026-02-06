import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type DrugSchedule = 'schedule_2' | 'schedule_3' | 'schedule_4' | 'schedule_5';

export type DrugEntryType = 'receipt' | 'administration' | 'return' | 'destruction';

@Entity('controlled_drug_entries')
@Index(['patientId'])
@Index(['drugName'])
@Index(['administeredAt'])
export class ControlledDrugEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid', nullable: true })
  patientId: string | null;

  @Column({ name: 'patient_chi', type: 'varchar', length: 11, nullable: true })
  patientChi: string | null;

  @Column({ name: 'drug_name', type: 'varchar', length: 200 })
  drugName: string;

  @Column({ name: 'drug_schedule', type: 'varchar', length: 20 })
  drugSchedule: DrugSchedule;

  @Column({ name: 'quantity_received', type: 'decimal', nullable: true })
  quantityReceived: number | null;

  @Column({ name: 'quantity_administered', type: 'decimal', nullable: true })
  quantityAdministered: number | null;

  @Column({ name: 'quantity_wasted', type: 'decimal', nullable: true })
  quantityWasted: number | null;

  @Column({ type: 'varchar', length: 20 })
  unit: string;

  @Column({ name: 'batch_number', type: 'varchar', length: 100, nullable: true })
  batchNumber: string | null;

  @Column({ name: 'entry_type', type: 'varchar', length: 30 })
  entryType: DrugEntryType;

  @Column({ name: 'administered_by_id', type: 'uuid', nullable: true })
  administeredById: string | null;

  @Column({ name: 'administered_by_name', type: 'varchar', length: 200, nullable: true })
  administeredByName: string | null;

  @Column({ name: 'witness_id', type: 'uuid', nullable: true })
  witnessId: string | null;

  @Column({ name: 'witness_name', type: 'varchar', length: 200, nullable: true })
  witnessName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  route: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'administered_at', type: 'timestamp' })
  administeredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
