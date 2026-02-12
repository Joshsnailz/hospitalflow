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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { extractDateStr, extractTimeStr } from '@/lib/utils/date-format';
import { appointmentsApi } from '@/lib/api/appointments';
import type { Appointment } from '@/lib/types/appointment';
import { Loader2 } from 'lucide-react';

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  isAdmin: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  appointment,
  isAdmin,
  onSuccess,
  onError,
}: RescheduleDialogProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && appointment) {
      setDate(extractDateStr(appointment.scheduledDate));
      setTime(extractTimeStr(appointment.scheduledDate));
      setReason('');
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (!appointment) return;
    try {
      setLoading(true);
      if (isAdmin) {
        if (!date || !time) return;
        const newDate = new Date(`${date}T${time}`).toISOString();
        await appointmentsApi.rescheduleAppointment(appointment.id, {
          newDate,
          reason: reason || undefined,
        });
        onSuccess('Appointment rescheduled successfully');
      } else {
        if (!reason) {
          onError('Please provide a reason for the reschedule request');
          setLoading(false);
          return;
        }
        await appointmentsApi.requestReschedule(appointment.id, reason);
        onSuccess('Reschedule request submitted for admin review');
      }
      onOpenChange(false);
    } catch (err: any) {
      onError(err?.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isAdmin ? 'Reschedule Appointment' : 'Request Reschedule'}</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? `Choose a new date and time for ${appointment?.patientName || 'this patient'}'s appointment.`
              : `Submit a reschedule request for ${appointment?.patientName || 'this patient'}'s appointment. An admin will review and set the new date.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isAdmin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="reschedule-date">New Date</Label>
                <Input
                  id="reschedule-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule-time">New Time</Label>
                <Input
                  id="reschedule-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="reschedule-reason">
              Reason{isAdmin ? ' (optional)' : ' (required)'}
            </Label>
            <Textarea
              id="reschedule-reason"
              placeholder="Reason for rescheduling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isAdmin ? !date || !time || loading : !reason || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAdmin ? 'Reschedule' : 'Request Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
