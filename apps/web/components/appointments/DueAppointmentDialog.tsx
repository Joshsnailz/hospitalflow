'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TYPE_LABELS } from '@/lib/constants/appointments';
import { formatDate, formatTime } from '@/lib/utils/date-format';
import { appointmentsApi } from '@/lib/api/appointments';
import type { Appointment } from '@/lib/types/appointment';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DueAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}

export function DueAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onSuccess,
  onError,
  onReschedule,
  onCancel,
}: DueAppointmentDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAttend = async () => {
    if (!appointment) return;
    try {
      setLoading(true);
      const response = await appointmentsApi.attendAppointment(appointment.id);
      const data = response.data;
      onOpenChange(false);
      if (data?.dischargeForm?.id) {
        onSuccess('Attending patient. Opening discharge form...');
        router.push(`/discharge/${data.dischargeForm.id}`);
      } else {
        onSuccess('Now attending patient');
      }
    } catch (err: any) {
      onError(err?.response?.data?.message || 'Failed to attend appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Appointment Due Now</DialogTitle>
          <DialogDescription>
            {appointment?.patientName || 'A patient'}&apos;s scheduled appointment is due.
            {appointment?.scheduledDate && (
              <> Scheduled for {formatTime(appointment.scheduledDate)} on {formatDate(appointment.scheduledDate)}.</>
            )}
          </DialogDescription>
        </DialogHeader>
        {appointment && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Patient</p>
                <p className="font-medium">{appointment.patientName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">
                  {TYPE_LABELS[appointment.appointmentType] || appointment.appointmentType}
                </p>
              </div>
              {appointment.reason && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Reason</p>
                  <p>{appointment.reason}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button onClick={handleAttend} disabled={loading} className="gap-1">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Attend Patient
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              if (appointment) onReschedule(appointment);
            }}
          >
            Reschedule
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              if (appointment) onCancel(appointment);
            }}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
