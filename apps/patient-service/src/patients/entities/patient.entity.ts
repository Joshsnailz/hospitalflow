import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PatientNextOfKinEntity } from './patient-next-of-kin.entity';
import { PatientMedicalHistoryEntity } from './patient-medical-history.entity';
import { PatientAllergyEntity } from './patient-allergy.entity';
import { PatientMedicalAidEntity } from './patient-medical-aid.entity';

export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'unknown';

@Entity('patients')
@Index(['chiNumber'], { unique: true })
@Index(['lastName', 'firstName'])
@Index(['isActive'])
@Index(['dateOfBirth'])
@Index(['createdAt'])
export class PatientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chi_number', type: 'varchar', length: 11, unique: true })
  chiNumber: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'middle_name', type: 'varchar', length: 100, nullable: true })
  middleName: string | null;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 10, default: 'unknown' })
  gender: Gender;

  @Column({ name: 'marital_status', type: 'varchar', length: 20, default: 'unknown' })
  maritalStatus: MaritalStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nationality: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ethnicity: string | null;

  @Column({ name: 'preferred_language', type: 'varchar', length: 50, default: 'English' })
  preferredLanguage: string;

  // Contact Information
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'phone_primary', type: 'varchar', length: 20, nullable: true })
  phonePrimary: string | null;

  @Column({ name: 'phone_secondary', type: 'varchar', length: 20, nullable: true })
  phoneSecondary: string | null;

  // Address
  @Column({ name: 'address_line_1', type: 'varchar', length: 255, nullable: true })
  addressLine1: string | null;

  @Column({ name: 'address_line_2', type: 'varchar', length: 255, nullable: true })
  addressLine2: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  county: string | null;

  @Column({ name: 'post_code', type: 'varchar', length: 20, nullable: true })
  postCode: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  // GP Information
  @Column({ name: 'gp_name', type: 'varchar', length: 200, nullable: true })
  gpName: string | null;

  @Column({ name: 'gp_practice_name', type: 'varchar', length: 200, nullable: true })
  gpPracticeName: string | null;

  @Column({ name: 'gp_practice_address', type: 'text', nullable: true })
  gpPracticeAddress: string | null;

  @Column({ name: 'gp_phone', type: 'varchar', length: 20, nullable: true })
  gpPhone: string | null;

  @Column({ name: 'gp_email', type: 'varchar', length: 255, nullable: true })
  gpEmail: string | null;

  // Status and Audit
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

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

  // Relations
  @OneToMany(() => PatientNextOfKinEntity, (nok) => nok.patient)
  nextOfKin: PatientNextOfKinEntity[];

  @OneToMany(() => PatientMedicalHistoryEntity, (history) => history.patient)
  medicalHistory: PatientMedicalHistoryEntity[];

  @OneToMany(() => PatientAllergyEntity, (allergy) => allergy.patient)
  allergies: PatientAllergyEntity[];

  @OneToMany(() => PatientMedicalAidEntity, (medicalAid) => medicalAid.patient)
  medicalAid: PatientMedicalAidEntity[];
}
