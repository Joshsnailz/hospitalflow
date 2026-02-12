import type { AppointmentStatus, AppointmentType, AppointmentScenario } from '@/lib/types/appointment';

export const STATUS_BADGE_MAP: Record<
  AppointmentStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }
> = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  pending_acceptance: { label: 'Pending Acceptance', variant: 'warning' },
  pending_reschedule: { label: 'Pending Reschedule', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'destructive' },
  rescheduled: { label: 'Rescheduled', variant: 'secondary' },
};

export const TYPE_LABELS: Record<AppointmentType, string> = {
  consultation: 'Consultation',
  follow_up: 'Follow-up',
  check_up: 'Check-up',
  emergency: 'Emergency',
  referral: 'Referral',
  lab_review: 'Lab Review',
  imaging: 'Imaging',
  nursing_assessment: 'Nursing Assessment',
  walk_in: 'Walk-in',
};

export const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'check_up', label: 'Check-up' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'referral', label: 'Referral' },
  { value: 'lab_review', label: 'Lab Review' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'nursing_assessment', label: 'Nursing Assessment' },
];

export const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

export const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'border-transparent bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  high: { label: 'High', className: 'border-transparent bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  normal: { label: 'Normal', className: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  low: { label: 'Low', className: 'border-transparent bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
};

export const SCENARIO_BADGE: Record<AppointmentScenario, { label: string; variant: 'destructive' | 'outline' | 'info' }> = {
  emergency: { label: 'Emergency', variant: 'destructive' },
  walk_in: { label: 'Walk-in', variant: 'outline' },
  scheduled: { label: 'Scheduled', variant: 'info' },
};

export const CANCELLABLE_STATUSES: AppointmentStatus[] = [
  'scheduled',
  'confirmed',
  'pending_acceptance',
  'pending_reschedule',
  'in_progress',
];

export const COMPLETABLE_STATUSES: AppointmentStatus[] = ['in_progress'];

export const REQUEST_STATUS_BADGE_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
};
