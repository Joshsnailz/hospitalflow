export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'unknown';

export interface Patient {
  id: string;
  chiNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  nationality: string | null;
  ethnicity: string | null;
  preferredLanguage: string;
  email: string | null;
  phonePrimary: string | null;
  phoneSecondary: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  county: string | null;
  postCode: string | null;
  country: string | null;
  gpName: string | null;
  gpPracticeName: string | null;
  gpPracticeAddress: string | null;
  gpPhone: string | null;
  gpEmail: string | null;
  isActive: boolean;
  notes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deactivatedAt: string | null;
  deactivatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  nextOfKin?: NextOfKin[];
  medicalHistory?: MedicalHistory[];
  allergies?: Allergy[];
  medicalAid?: MedicalAid[];
}

export type RelationshipType =
  | 'spouse'
  | 'parent'
  | 'child'
  | 'sibling'
  | 'grandparent'
  | 'grandchild'
  | 'aunt_uncle'
  | 'niece_nephew'
  | 'cousin'
  | 'friend'
  | 'partner'
  | 'guardian'
  | 'other';

export interface NextOfKin {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  relationship: RelationshipType;
  phonePrimary: string;
  phoneSecondary: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postCode: string | null;
  isPrimaryContact: boolean;
  isEmergencyContact: boolean;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MedicalHistoryType =
  | 'condition'
  | 'surgery'
  | 'hospitalization'
  | 'family_history'
  | 'immunization'
  | 'other';

export type MedicalHistoryStatus = 'active' | 'resolved' | 'chronic' | 'unknown';

export interface MedicalHistory {
  id: string;
  patientId: string;
  type: MedicalHistoryType;
  title: string;
  description: string | null;
  icdCode: string | null;
  onsetDate: string | null;
  resolutionDate: string | null;
  status: MedicalHistoryStatus;
  diagnosedBy: string | null;
  treatmentNotes: string | null;
  familyMemberRelation: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AllergyType = 'drug' | 'food' | 'environmental' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening' | 'unknown';
export type AllergyStatus = 'active' | 'inactive' | 'resolved';

export interface Allergy {
  id: string;
  patientId: string;
  allergenName: string;
  allergyType: AllergyType;
  severity: AllergySeverity;
  reaction: string | null;
  onsetDate: string | null;
  diagnosedDate: string | null;
  diagnosedBy: string | null;
  status: AllergyStatus;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MedicalAidStatus = 'active' | 'expired' | 'suspended' | 'cancelled';

export interface MedicalAid {
  id: string;
  patientId: string;
  providerName: string;
  planName: string | null;
  membershipNumber: string;
  groupNumber: string | null;
  policyHolderName: string | null;
  policyHolderRelationship: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  status: MedicalAidStatus;
  isPrimary: boolean;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientDto {
  chiNumber?: string;
  isEmergency?: boolean;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  nationality?: string;
  ethnicity?: string;
  preferredLanguage?: string;
  email?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  postCode?: string;
  country?: string;
  gpName?: string;
  gpPracticeName?: string;
  gpPracticeAddress?: string;
  gpPhone?: string;
  gpEmail?: string;
  notes?: string;
}

export interface UpdatePatientDto extends Partial<Omit<CreatePatientDto, 'chiNumber'>> {}

export interface PatientFilterDto {
  search?: string;
  chiNumber?: string;
  gender?: Gender;
  city?: string;
  dateOfBirthFrom?: string;
  dateOfBirthTo?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChiValidationResult {
  isValid: boolean;
  normalizedChi: string | null;
  errors: string[];
  exists?: boolean;
}

export interface CreateNextOfKinDto {
  firstName: string;
  lastName: string;
  relationship?: RelationshipType;
  phonePrimary: string;
  phoneSecondary?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postCode?: string;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  notes?: string;
}

export interface CreateAllergyDto {
  allergenName: string;
  allergyType?: AllergyType;
  severity?: AllergySeverity;
  reaction?: string;
  onsetDate?: string;
  diagnosedDate?: string;
  diagnosedBy?: string;
  status?: AllergyStatus;
  notes?: string;
}

export interface CreateMedicalHistoryDto {
  type?: MedicalHistoryType;
  title: string;
  description?: string;
  icdCode?: string;
  onsetDate?: string;
  resolutionDate?: string;
  status?: MedicalHistoryStatus;
  diagnosedBy?: string;
  treatmentNotes?: string;
  familyMemberRelation?: string;
  notes?: string;
}

export interface CreateMedicalAidDto {
  providerName: string;
  planName?: string;
  membershipNumber: string;
  groupNumber?: string;
  policyHolderName?: string;
  policyHolderRelationship?: string;
  effectiveDate?: string;
  expiryDate?: string;
  status?: MedicalAidStatus;
  isPrimary?: boolean;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}
