import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EncounterEntity } from './encounter.entity';

export type NoteType = 'progress' | 'nursing' | 'consultation' | 'procedure' | 'assessment';

@Entity('clinical_notes')
@Index(['encounterId'])
@Index(['authorId'])
export class ClinicalNoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'encounter_id', type: 'uuid' })
  encounterId: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @Column({ name: 'author_name', type: 'varchar', length: 200 })
  authorName: string;

  @Column({ name: 'author_role', type: 'varchar', length: 50 })
  authorRole: string;

  @Column({ name: 'note_type', type: 'varchar', length: 50 })
  noteType: NoteType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => EncounterEntity, (encounter) => encounter.clinicalNotes)
  @JoinColumn({ name: 'encounter_id' })
  encounter: EncounterEntity;
}
