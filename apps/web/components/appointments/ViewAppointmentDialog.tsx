'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { TYPE_LABELS } from '@/lib/constants/appointments';
import { formatDate, formatTime } from '@/lib/utils/date-format';
import type { Appointment } from '@/lib/types/appointment';

interface ViewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

export function ViewAppointmentDialog({ open, onOpenChange, appointment }: ViewAppointmentDialogProps) {
  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
          <DialogDescription>Full information for this appointment</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Patient</p>
              <p className="font-medium">{appointment.patientName || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CHI Number</p>
              <p className="font-medium font-mono">{appointment.patientChi || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Doctor</p>
              <p className="font-medium">
                {appointment.doctorName ? `Dr ${appointment.doctorName}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Priority</p>
              <p className="font-medium capitalize">{appointment.priority || 'normal'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium">
                {TYPE_LABELS[appointment.appointmentType] || appointment.appointmentType}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(appointment.scheduledDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Time</p>
              <p className="font-medium">
                {formatTime(appointment.scheduledDate)}
                {appointment.durationMinutes ? ` (${appointment.durationMinutes} min)` : ''}
              </p>
            </div>
            {appointment.autoAssigned && (
              <div className="col-span-2">
                <Badge variant="info">Auto-assigned</Badge>
              </div>
            )}
          </div>
          {appointment.reason && (
            <div className="text-sm">
              <p className="text-muted-foreground">Reason</p>
              <p className="mt-1">{appointment.reason}</p>
            </div>
          )}
          {appointment.notes && (
            <div className="text-sm">
              <p className="text-muted-foreground">Notes</p>
              <p className="mt-1">{appointment.notes}</p>
            </div>
          )}
          {appointment.referredById && (
            <div className="text-sm">
              <p className="text-muted-foreground">Referred By</p>
              <p className="mt-1 font-mono text-xs">{appointment.referredById}</p>
            </div>
          )}
          <div className="text-xs text-muted-foreground border-t pt-3">
            Created {formatDate(appointment.createdAt)}
            {appointment.updatedAt !== appointment.createdAt &&
              ` | Updated ${formatDate(appointment.updatedAt)}`}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
