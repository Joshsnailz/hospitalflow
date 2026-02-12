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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils/date-format';
import { appointmentsApi } from '@/lib/api/appointments';
import type { Appointment } from '@/lib/types/appointment';
import { Loader2 } from 'lucide-react';

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  isAdmin: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function CancelDialog({
  open,
  onOpenChange,
  appointment,
  isAdmin,
  onSuccess,
  onError,
}: CancelDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setReason('');
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (!appointment) return;
    try {
      setLoading(true);
      if (isAdmin) {
        await appointmentsApi.cancelAppointment(appointment.id, reason || undefined);
        onSuccess('Appointment cancelled');
      } else {
        if (!reason) {
          onError('Please provide a reason for the cancellation request');
          setLoading(false);
          return;
        }
        await appointmentsApi.requestCancel(appointment.id, reason);
        onSuccess('Cancellation request submitted for admin review');
      }
      onOpenChange(false);
    } catch (err: any) {
      onError(err?.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isAdmin ? 'Cancel Appointment' : 'Request Cancellation'}</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? `Are you sure you want to cancel ${appointment?.patientName || 'this patient'}'s appointment on ${appointment ? formatDate(appointment.scheduledDate) : ''}? This action cannot be undone.`
              : `Submit a cancellation request for ${appointment?.patientName || 'this patient'}'s appointment. An admin will review and approve or reject.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">
              Cancellation Reason{isAdmin ? '' : ' (required)'}
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="Please provide a reason for cancelling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Appointment
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isAdmin ? loading : !reason || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAdmin ? 'Cancel Appointment' : 'Request Cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
