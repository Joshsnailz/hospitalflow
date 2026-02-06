export type EncounterStatus = 'admitted' | 'in_treatment' | 'awaiting_discharge' | 'discharged' | 'deceased' | 'transferred';
export type EncounterType = 'outpatient' | 'inpatient' | 'emergency' | 'day_case';

export interface Encounter {
  id: string;
  patientId: string;
  patientName?: string;
  patientChi: string;
  doctorId: string;
  doctorName?: string;
  admittingDoctorId: string;
  attendingDoctorId: string | null;
  hospitalId: string | null;
  departmentId: string | null;
  wardId: string | null;
  bedId: string | null;
  type: EncounterType;
  status: EncounterStatus;
  chiefComplaint: string | null;
  diagnosis: string | null;
  icdCodes: string[] | null;
  treatmentPlan: string | null;
  vitals: Record<string, any> | null;
  admissionDate: string;
  dischargeDate: string | null;
  notes: ClinicalNote[];
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNote {
  id: string;
  encounterId: string;
  authorId: string;
  authorName?: string;
  authorRole?: string;
  noteType: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
export type AppointmentType = 'consultation' | 'follow_up' | 'emergency' | 'procedure' | 'lab_review' | 'imaging_review' | 'referral' | 'check_up';

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  patientChiNumber?: string;
  doctorId: string;
  doctorName?: string;
  hospitalId: string | null;
  departmentId: string | null;
  departmentName?: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  reason: string | null;
  notes: string | null;
  autoAssigned: boolean;
  referredFrom: string | null;
  referredTo: string | null;
  cancellationReason: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId?: string;
  hospitalId?: string;
  departmentId?: string;
  type: AppointmentType;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  reason?: string;
  notes?: string;
  autoAssign?: boolean;
}

export type DischargeStatus = 'active' | 'pending_review' | 'completed' | 'cancelled';

export interface DischargeForm {
  id: string;
  patientId: string;
  patientName?: string;
  patientChiNumber?: string;
  encounterId: string | null;
  status: DischargeStatus;
  admissionDate: string;
  dischargeDate: string | null;
  dischargeType: string | null;
  primaryDiagnosis: string | null;
  secondaryDiagnoses: string[] | null;
  clinicalSummary: string | null;
  treatmentProvided: string | null;
  medicationsOnDischarge: MedicationEntry[] | null;
  pharmacyNotes: string | null;
  pharmacyReviewedBy: string | null;
  pharmacyReviewedAt: string | null;
  operationsAndProcedures: ProcedureEntry[] | null;
  surgeonNotes: string | null;
  followUpInstructions: string | null;
  followUpDate: string | null;
  followUpDoctor: string | null;
  nursingNotes: string | null;
  vitalSignsOnDischarge: Record<string, any> | null;
  dietaryInstructions: string | null;
  activityRestrictions: string | null;
  patientEducation: string | null;
  dischargedBy: string | null;
  version: number;
  lastUpdatedBy: string | null;
  lastUpdatedSection: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  instructions: string;
}

export interface ProcedureEntry {
  name: string;
  date: string;
  surgeon: string;
  notes: string;
  outcome: string;
}

export type ImagingStatus = 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ImagingType = 'xray' | 'ct_scan' | 'mri' | 'ultrasound' | 'fluoroscopy' | 'mammography' | 'pet_scan' | 'other';
export type ImagingPriority = 'routine' | 'urgent' | 'stat';

export interface ImagingRequest {
  id: string;
  patientId: string;
  patientName?: string;
  patientChiNumber?: string;
  requestedBy: string;
  requestedByName?: string;
  imagingType: ImagingType;
  bodyPart: string;
  clinicalIndication: string;
  priority: ImagingPriority;
  status: ImagingStatus;
  scheduledDate: string | null;
  completedDate: string | null;
  results: string | null;
  reportedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImagingRequestDto {
  patientId: string;
  imagingType: ImagingType;
  bodyPart: string;
  clinicalIndication: string;
  priority?: ImagingPriority;
  scheduledDate?: string;
  notes?: string;
}

export type DrugSchedule = 'schedule_2' | 'schedule_3' | 'schedule_4' | 'schedule_5';
export type DrugEntryType = 'administration' | 'receipt' | 'disposal' | 'transfer';

export interface ControlledDrugEntry {
  id: string;
  patientId: string | null;
  patientName?: string;
  patientChiNumber?: string;
  drugName: string;
  drugSchedule: DrugSchedule;
  batchNumber: string | null;
  entryType: DrugEntryType;
  quantity: number;
  unit: string;
  balanceAfter: number;
  administeredBy: string | null;
  administeredByName?: string;
  witnessedBy: string | null;
  witnessedByName?: string;
  prescribedBy: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateControlledDrugEntryDto {
  patientId?: string;
  drugName: string;
  drugSchedule: DrugSchedule;
  batchNumber?: string;
  entryType: DrugEntryType;
  quantity: number;
  unit: string;
  balanceAfter: number;
  witnessedBy?: string;
  prescribedBy?: string;
  reason?: string;
  notes?: string;
}

export type TriageCategory = 'red' | 'orange' | 'yellow' | 'green' | 'blue';
export type EmergencyStatus = 'triaged' | 'in_treatment' | 'observation' | 'admitted' | 'discharged' | 'transferred' | 'deceased';

export interface EmergencyVisit {
  id: string;
  patientId: string;
  patientName?: string;
  patientChiNumber?: string;
  encounterId: string | null;
  triageCategory: TriageCategory;
  chiefComplaint: string;
  arrivalMode: string;
  arrivalTime: string;
  triageTime: string | null;
  treatmentStartTime: string | null;
  status: EmergencyStatus;
  attendingDoctor: string | null;
  attendingDoctorName?: string;
  vitals: Record<string, any> | null;
  treatmentNotes: string | null;
  disposition: string | null;
  dispositionTime: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmergencyVisitDto {
  patientId: string;
  triageCategory: TriageCategory;
  chiefComplaint: string;
  arrivalMode?: string;
  arrivalTime: string;
  vitals?: Record<string, any>;
  notes?: string;
}

export type CarePlanStatus = 'active' | 'completed' | 'on_hold' | 'cancelled';

export interface CarePlan {
  id: string;
  patientId: string;
  patientName?: string;
  patientChiNumber?: string;
  title: string;
  description: string | null;
  category: string;
  status: CarePlanStatus;
  startDate: string;
  endDate: string | null;
  reviewDate: string | null;
  goals: CarePlanGoal[] | null;
  interventions: CarePlanIntervention[] | null;
  createdBy: string;
  createdByName?: string;
  assignedTo: string | null;
  assignedToName?: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CarePlanGoal {
  description: string;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'achieved' | 'not_achieved';
  notes: string;
}

export interface CarePlanIntervention {
  description: string;
  frequency: string;
  assignedTo: string;
  status: 'active' | 'completed' | 'discontinued';
  notes: string;
}

export interface CreateCarePlanDto {
  patientId: string;
  title: string;
  description?: string;
  category: string;
  startDate: string;
  endDate?: string;
  reviewDate?: string;
  goals?: CarePlanGoal[];
  interventions?: CarePlanIntervention[];
  assignedTo?: string;
  notes?: string;
}

export interface DashboardStats {
  role: string;
  totalPatients: number;
  todayAppointments: number;
  upcomingAppointments: Appointment[];
  activeDischargeForms: number;
  pendingImagingRequests: number;
  emergencyVisits: number;
  activeCarePlans: number;
  activeEncounters: number;
  recentActivities: DashboardActivity[];
  // Role-specific
  controlledDrugEntries?: number;
  pharmacyDischargesPending?: number;
  wardOccupancy?: number;
  bedAvailability?: number;
  monthlyPatientsSeen?: number;
  monthlyAppointments?: number;
  monthlyPrescriptions?: number;
}

export interface AppointmentDashboardStats {
  totalToday: number;
  completed: number;
  checkedIn: number;
  noShows: number;
  cancelled: number;
  upcoming: number;
  averageWaitTime: number;
  byType: Record<string, number>;
  byDepartment: Record<string, number>;
}

export interface EncounterDashboardStats {
  totalActive: number;
  admitted: number;
  inTreatment: number;
  awaitingDischarge: number;
  discharged: number;
  averageLengthOfStay: number;
  byWard: Record<string, number>;
  byType: Record<string, number>;
  bedOccupancyRate: number;
}

export interface EmergencyDashboardStats {
  totalActive: number;
  byTriageCategory: Record<TriageCategory, number>;
  averageWaitTime: number;
  averageTreatmentTime: number;
  admissionRate: number;
  inTreatment: number;
  awaitingBed: number;
  discharged24h: number;
}

export interface DischargeDashboardStats {
  pendingReview: number;
  completedToday: number;
  averageDischargeTime: number;
  pendingPharmacyReview: number;
  byDischargeType: Record<string, number>;
  readmissionRate: number;
}

export interface HospitalDashboardStats {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  byWard: Record<string, { total: number; occupied: number; available: number }>;
  maintenanceBeds: number;
}

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  userId: string;
  userName?: string;
}
