import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type TriageLevel =
  | 'resuscitation'
  | 'emergency'
  | 'urgent'
  | 'semi_urgent'
  | 'non_urgent';

export type EmergencyStatus =
  | 'waiting'
  | 'triaged'
  | 'being_seen'
  | 'admitted'
  | 'discharged'
  | 'transferred'
  | 'left_without_being_seen';

export type EmergencyDisposition =
  | 'admitted'
  | 'discharged_home'
  | 'transferred'
  | 'deceased'
  | 'left_ama';

@Entity('emergency_visits')
@Index(['patientId'])
@Index(['triageLevel'])
@Index(['status'])
@Index(['arrivalTime'])
export class EmergencyVisitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'patient_chi', type: 'varchar', length: 11 })
  patientChi: string;

  @Column({ name: 'encounter_id', type: 'uuid', nullable: true })
  encounterId: string | null;

  @Column({ name: 'arrival_time', type: 'timestamp', default: () => 'NOW()' })
  arrivalTime: Date;

  @Column({ name: 'triage_level', type: 'varchar', length: 20 })
  triageLevel: TriageLevel;

  @Column({ name: 'triage_notes', type: 'text', nullable: true })
  triageNotes: string | null;

  @Column({ name: 'triaged_by_id', type: 'uuid', nullable: true })
  triagedById: string | null;

  @Column({ name: 'triaged_by_name', type: 'varchar', length: 200, nullable: true })
  triagedByName: string | null;

  @Column({ name: 'chief_complaint', type: 'text' })
  chiefComplaint: string;

  @Column({ name: 'presenting_symptoms', type: 'text', nullable: true })
  presentingSymptoms: string | null;

  @Column({ name: 'vital_signs', type: 'jsonb', nullable: true })
  vitalSigns: Record<string, unknown> | null;

  @Column({ name: 'attending_doctor_id', type: 'uuid', nullable: true })
  attendingDoctorId: string | null;

  @Column({ name: 'attending_doctor_name', type: 'varchar', length: 200, nullable: true })
  attendingDoctorName: string | null;

  @Column({ type: 'varchar', length: 30, default: 'waiting' })
  status: EmergencyStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  disposition: EmergencyDisposition | null;

  @Column({ name: 'disposition_time', type: 'timestamp', nullable: true })
  dispositionTime: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
