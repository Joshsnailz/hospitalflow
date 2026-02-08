'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Stethoscope,
  Ambulance,
  FileText,
  Loader2,
  Clock,
  User,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { clinicalApi } from '@/lib/api/clinical';
import type {
  Appointment,
  AppointmentStatus,
  Encounter,
  EncounterStatus,
  EmergencyVisit,
  EmergencyStatus,
  DischargeForm,
  DischargeStatus,
} from '@/lib/types/clinical';

interface PatientJourneyTimelineProps {
  patientId: string;
}

type TimelineEventType = 'appointment' | 'encounter' | 'emergency' | 'discharge';

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  status: string;
  summary: string;
  clinician: string;
}

// --- Status badge color mapping ---

function getAppointmentBadgeVariant(
  status: AppointmentStatus
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'scheduled':
    case 'confirmed':
      return 'info';
    case 'in_progress':
      return 'default';
    case 'cancelled':
    case 'no_show':
      return 'destructive';
    case 'rescheduled':
      return 'warning';
    default:
      return 'secondary';
  }
}

function getEncounterBadgeVariant(
  status: EncounterStatus
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (status) {
    case 'admitted':
    case 'in_treatment':
      return 'info';
    case 'awaiting_discharge':
      return 'warning';
    case 'discharged':
      return 'success';
    case 'deceased':
      return 'destructive';
    case 'transferred':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function getEmergencyBadgeVariant(
  status: EmergencyStatus
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (status) {
    case 'triaged':
      return 'warning';
    case 'in_treatment':
      return 'destructive';
    case 'observation':
      return 'info';
    case 'admitted':
      return 'default';
    case 'discharged':
      return 'success';
    case 'transferred':
      return 'secondary';
    case 'deceased':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getDischargeBadgeVariant(
  status: DischargeStatus
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (status) {
    case 'active':
      return 'info';
    case 'pending_review':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getBadgeVariant(
  type: TimelineEventType,
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (type) {
    case 'appointment':
      return getAppointmentBadgeVariant(status as AppointmentStatus);
    case 'encounter':
      return getEncounterBadgeVariant(status as EncounterStatus);
    case 'emergency':
      return getEmergencyBadgeVariant(status as EmergencyStatus);
    case 'discharge':
      return getDischargeBadgeVariant(status as DischargeStatus);
    default:
      return 'secondary';
  }
}

// --- Icon mapping ---

function getEventIcon(type: TimelineEventType) {
  switch (type) {
    case 'appointment':
      return CalendarDays;
    case 'encounter':
      return Stethoscope;
    case 'emergency':
      return Ambulance;
    case 'discharge':
      return FileText;
  }
}

function getEventIconStyles(type: TimelineEventType): { bg: string; text: string } {
  switch (type) {
    case 'appointment':
      return { bg: 'bg-blue-100', text: 'text-blue-600' };
    case 'encounter':
      return { bg: 'bg-emerald-100', text: 'text-emerald-600' };
    case 'emergency':
      return { bg: 'bg-red-100', text: 'text-red-600' };
    case 'discharge':
      return { bg: 'bg-amber-100', text: 'text-amber-600' };
  }
}

// --- Label mapping ---

function getTypeLabel(type: TimelineEventType): string {
  switch (type) {
    case 'appointment':
      return 'Appointment';
    case 'encounter':
      return 'Encounter';
    case 'emergency':
      return 'Emergency Visit';
    case 'discharge':
      return 'Discharge';
  }
}

// --- Date formatting ---

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// --- Skeleton ---

function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            {i < 3 && <div className="w-0.5 flex-1 bg-muted animate-pulse mt-2" />}
          </div>
          <div className="flex-1 space-y-2 pb-6">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-48 bg-muted animate-pulse rounded" />
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main component ---

export function PatientJourneyTimeline({ patientId }: PatientJourneyTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJourneyData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [appointmentsRes, encountersRes, emergencyRes, dischargeRes] =
        await Promise.allSettled([
          clinicalApi.getPatientAppointments(patientId),
          clinicalApi.getEncountersByPatient(patientId),
          clinicalApi.getEmergencyVisitsByPatient(patientId),
          clinicalApi.getPatientDischargeForms(patientId),
        ]);

      const timelineEvents: TimelineEvent[] = [];

      // Map appointments
      if (appointmentsRes.status === 'fulfilled') {
        const appointments: Appointment[] = appointmentsRes.value.data || [];
        appointments.forEach((appt) => {
          timelineEvents.push({
            id: `appt-${appt.id}`,
            type: 'appointment',
            date: appt.scheduledDate,
            status: appt.status,
            summary: appt.reason
              ? `${formatStatusLabel(appt.appointmentType || appt.type)} — ${appt.reason}`
              : formatStatusLabel(appt.appointmentType || appt.type),
            clinician: appt.doctorName || 'Unassigned',
          });
        });
      }

      // Map encounters
      if (encountersRes.status === 'fulfilled') {
        const encounters: Encounter[] = encountersRes.value.data || [];
        encounters.forEach((enc) => {
          timelineEvents.push({
            id: `enc-${enc.id}`,
            type: 'encounter',
            date: enc.admissionDate,
            status: enc.status,
            summary: enc.chiefComplaint
              ? `${formatStatusLabel(enc.encounterType || enc.type)} — ${enc.chiefComplaint}`
              : formatStatusLabel(enc.encounterType || enc.type),
            clinician: enc.doctorName || 'Unassigned',
          });
        });
      }

      // Map emergency visits
      if (emergencyRes.status === 'fulfilled') {
        const visits: EmergencyVisit[] = emergencyRes.value.data || [];
        visits.forEach((visit) => {
          timelineEvents.push({
            id: `emg-${visit.id}`,
            type: 'emergency',
            date: visit.arrivalTime,
            status: visit.status,
            summary: visit.chiefComplaint
              ? `${visit.arrivalMode ? formatStatusLabel(visit.arrivalMode) + ' — ' : ''}${visit.chiefComplaint}`
              : `Emergency arrival${visit.arrivalMode ? ' via ' + visit.arrivalMode : ''}`,
            clinician: visit.attendingDoctorName || 'Unassigned',
          });
        });
      }

      // Map discharge forms
      if (dischargeRes.status === 'fulfilled') {
        const forms: DischargeForm[] = dischargeRes.value.data || [];
        forms.forEach((form) => {
          timelineEvents.push({
            id: `dis-${form.id}`,
            type: 'discharge',
            date: form.dischargeDate || form.createdAt,
            status: form.status,
            summary: form.primaryDiagnosis
              ? `Discharge — ${form.primaryDiagnosis}`
              : `Discharge form (${formatStatusLabel(form.status)})`,
            clinician: form.dischargedBy || 'Pending',
          });
        });
      }

      // Sort chronologically, most recent first
      timelineEvents.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setEvents(timelineEvents);
    } catch {
      setError('Failed to load patient journey data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      fetchJourneyData();
    }
  }, [patientId, fetchJourneyData]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-5 w-5 text-primary" />
          Patient Journey
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {loading ? (
          <TimelineSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No events found
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              This patient has no recorded appointments, encounters, emergency
              visits, or discharge forms.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="pr-4">
              {events.map((event, index) => {
                const Icon = getEventIcon(event.type);
                const iconStyles = getEventIconStyles(event.type);
                const badgeVariant = getBadgeVariant(event.type, event.status);
                const isLast = index === events.length - 1;

                return (
                  <div key={event.id} className="flex gap-4">
                    {/* Timeline column: icon + vertical line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          iconStyles.bg
                        )}
                      >
                        <Icon className={cn('h-5 w-5', iconStyles.text)} />
                      </div>
                      {!isLast && (
                        <div className="w-0.5 flex-1 bg-border mt-2" />
                      )}
                    </div>

                    {/* Content column */}
                    <div className={cn('flex-1 min-w-0 pb-8', isLast && 'pb-2')}>
                      {/* Header: type label + status badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {getTypeLabel(event.type)}
                        </span>
                        <Badge variant={badgeVariant}>
                          {formatStatusLabel(event.status)}
                        </Badge>
                      </div>

                      {/* Summary */}
                      <p className="text-sm text-foreground mt-1 line-clamp-2">
                        {event.summary}
                      </p>

                      {/* Metadata: date + clinician */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(event.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {event.clinician}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
