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
import { appointmentsApi } from '@/lib/api/appointments';
import type { RescheduleRequest } from '@/lib/types/appointment';
import { Loader2 } from 'lucide-react';

interface ResolveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RescheduleRequest | null;
  resolution: 'approved' | 'rejected';
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function ResolveRequestDialog({
  open,
  onOpenChange,
  request,
  resolution,
  onSuccess,
  onError,
}: ResolveRequestDialogProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isApprove = resolution === 'approved';
  const isCancel = request?.type === 'cancel';

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDate('');
      setTime('');
      setNotes('');
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (!request) return;
    try {
      setLoading(true);
      if (isApprove) {
        const newDate = isCancel ? undefined : new Date(`${date}T${time}`).toISOString();
        await appointmentsApi.resolveRescheduleRequest(request.id, {
          resolution: 'approved',
          newDate,
          notes: notes || undefined,
        });
        onSuccess(isCancel ? 'Cancellation approved' : 'Reschedule request approved successfully');
      } else {
        await appointmentsApi.resolveRescheduleRequest(request.id, {
          resolution: 'rejected',
          notes: notes || undefined,
        });
        onSuccess('Request rejected');
      }
      onOpenChange(false);
    } catch (err: any) {
      onError(err?.response?.data?.message || `Failed to ${resolution} request`);
    } finally {
      setLoading(false);
    }
  };

  const title = isApprove
    ? isCancel
      ? 'Approve Cancellation'
      : 'Approve Reschedule Request'
    : 'Reject Request';

  const description = isApprove
    ? isCancel
      ? 'Approving will cancel the appointment. This cannot be undone.'
      : 'Set the new appointment date and time for this reschedule request.'
    : `Are you sure you want to reject this request from ${request?.requestedByName || 'this user'}?`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isApprove && !isCancel && (
            <>
              <div className="space-y-2">
                <Label htmlFor="resolve-date">New Date</Label>
                <Input
                  id="resolve-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolve-time">New Time</Label>
                <Input
                  id="resolve-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="resolve-notes">Notes (optional)</Label>
            <Textarea
              id="resolve-notes"
              placeholder={isApprove ? 'Additional notes...' : 'Reason for rejection...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={isApprove && isCancel ? 'destructive' : isApprove ? 'default' : 'destructive'}
            onClick={handleSubmit}
            disabled={isApprove && !isCancel ? !date || !time || loading : loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isApprove ? (isCancel ? 'Approve Cancellation' : 'Approve') : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
