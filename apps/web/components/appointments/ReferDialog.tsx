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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatRoleName } from '@/lib/utils/date-format';
import { appointmentsApi } from '@/lib/api/appointments';
import type { Appointment } from '@/lib/types/appointment';
import type { Clinician } from '@/lib/api/users';
import { Loader2 } from 'lucide-react';

interface ReferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  doctors: Clinician[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function ReferDialog({
  open,
  onOpenChange,
  appointment,
  doctors,
  onSuccess,
  onError,
}: ReferDialogProps) {
  const [doctor, setDoctor] = useState('');
  const [department, setDepartment] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDoctor('');
      setDepartment('');
      setReason('');
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (!appointment || !doctor) return;
    try {
      setLoading(true);
      await appointmentsApi.referAppointment(appointment.id, {
        newDoctorId: doctor,
        reason: reason || undefined,
      });
      onSuccess('Appointment referred successfully');
      onOpenChange(false);
    } catch (err: any) {
      onError(err?.response?.data?.message || 'Failed to refer appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refer Appointment</DialogTitle>
          <DialogDescription>
            Refer {appointment?.patientName || 'this patient'}&apos;s appointment to another doctor or department.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Target Doctor</Label>
            <Select value={doctor} onValueChange={setDoctor}>
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors
                  .filter((d) => d.id !== appointment?.doctorId)
                  .map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.firstName} {doc.lastName} ({formatRoleName(doc.role)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="refer-department">Department (optional)</Label>
            <Input
              id="refer-department"
              placeholder="Department ID or name"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refer-reason">Reason (optional)</Label>
            <Textarea
              id="refer-reason"
              placeholder="Reason for referral..."
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
          <Button onClick={handleSubmit} disabled={!doctor || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refer Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
