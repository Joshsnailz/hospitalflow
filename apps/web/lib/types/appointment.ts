export type AppointmentScenario = 'emergency' | 'walk_in' | 'scheduled';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'pending_acceptance'
  | 'pending_reschedule'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export type AppointmentType =
  | 'consultation'
  | 'follow_up'
  | 'check_up'
  | 'emergency'
  | 'referral'
  | 'lab_review'
  | 'imaging'
  | 'nursing_assessment'
  | 'walk_in';

export interface Appointment {
  id: string;
  patientId: string | null;
  patientChi: string | null;
  patientName: string | null;
  doctorId: string | null;
  doctorName: string | null;
  hospitalId: string;
  departmentId: string | null;
  scenario: AppointmentScenario;
  appointmentType: AppointmentType;
  scheduledDate: string;
  endTime: string | null;
  durationMinutes: number;
  status: AppointmentStatus;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  reason: string | null;
  notes: string | null;
  referredById: string | null;
  autoAssigned: boolean;
  createdBy: string | null;
  // Emergency fields
  isEmergencyUnknown: boolean;
  emergencyAlias: string | null;
  emergencyConditions: string | null;
  // Preferred clinician
  preferredClinicianId: string | null;
  preferredClinicianName: string | null;
  // Acceptance
  acceptedById: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  scenario: AppointmentScenario;
  patientId?: string;
  patientChi?: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  hospitalId: string;
  departmentId?: string;
  appointmentType: AppointmentType;
  scheduledDate?: string;
  endTime?: string;
  durationMinutes?: number;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  reason?: string;
  notes?: string;
  referredById?: string;
  autoAssign?: boolean;
  // Emergency
  isEmergencyUnknown?: boolean;
  emergencyAlias?: string;
  emergencyConditions?: string;
  // Preferred clinician
  preferredClinicianId?: string;
  preferredClinicianName?: string;
}

export type AvailabilityStatus = 'available' | 'offline' | 'busy' | 'away';

export interface ClinicianAvailability {
  id: string;
  clinicianId: string;
  clinicianName: string;
  clinicianRole: string;
  status: AvailabilityStatus;
  hospitalId: string | null;
  departmentId: string | null;
  lastStatusChange: string | null;
  blockedSlots: Array<{ appointmentId: string; start: string; end: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentDashboardStats {
  total: number;
  scheduled: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
  pendingAcceptance: number;
  todayTotal: number;
  todayCompleted: number;
  todayUpcoming: number;
}

export type AppointmentAction =
  | 'view'
  | 'accept'
  | 'check_in'
  | 'attend'
  | 'complete'
  | 'reschedule'
  | 'cancel'
  | 'refer';

export interface AppointmentDialogState {
  type: AppointmentAction | 'resolve_request' | null;
  appointment: Appointment | null;
}

export type RescheduleRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface RescheduleRequest {
  id: string;
  appointmentId: string;
  requestedById: string;
  requestedByName: string;
  requestedByRole: string;
  reason: string;
  type: 'reschedule' | 'cancel';
  status: RescheduleRequestStatus;
  resolvedById: string | null;
  resolvedAt: string | null;
  newDate: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}
