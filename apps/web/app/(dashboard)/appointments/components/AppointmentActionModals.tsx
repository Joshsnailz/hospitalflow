'use client';

import { useState, useEffect } from 'react';
import { clinicalApi } from '@/lib/api/clinical';
import { usersApi } from '@/lib/api/users';
import type { Appointment, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';

interface AppointmentActionModalsProps {
  appointment: Appointment | null;
  acceptDialogOpen: boolean;
  setAcceptDialogOpen: (open: boolean) => void;
  rejectDialogOpen: boolean;
  setRejectDialogOpen: (open: boolean) => void;
  referDialogOpen: boolean;
  setReferDialogOpen: (open: boolean) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export function AppointmentActionModals({
  appointment,
  acceptDialogOpen,
  setAcceptDialogOpen,
  rejectDialogOpen,
  setRejectDialogOpen,
  referDialogOpen,
  setReferDialogOpen,
  onSuccess,
  onError,
  onRefresh,
}: AppointmentActionModalsProps) {
  // Accept state
  const [acceptLoading, setAcceptLoading] = useState(false);

  // Reject state
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Refer state
  const [referToClinicianId, setReferToClinicianId] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [referLoading, setReferLoading] = useState(false);
  const [clinicians, setClinicians] = useState<User[]>([]);
  const [cliniciansLoading, setCliniciansLoading] = useState(false);

  // Fetch clinicians when refer dialog opens
  useEffect(() => {
    if (referDialogOpen && appointment) {
      fetchClinicians();
    }
  }, [referDialogOpen, appointment]);

  const fetchClinicians = async () => {
    if (!appointment) return;
    try {
      setCliniciansLoading(true);
      const response = await usersApi.findAll({
        role: 'doctor,consultant,nurse,hospital_pharmacist,prescriber',
        isActive: true,
        // Filter by same hospital if hospitalId is available
        ...(appointment.hospitalId && { hospitalId: appointment.hospitalId }),
        limit: 200,
      });
      if (response.success) {
        // Filter out current clinician
        setClinicians(response.data.filter((c: User) => c.id !== appointment.doctorId));
      }
    } catch (error) {
      console.error('Failed to fetch clinicians:', error);
    } finally {
      setCliniciansLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!appointment) return;
    try {
      setAcceptLoading(true);
      const response = await clinicalApi.acceptAppointment(appointment.id);
      if (response.success) {
        onSuccess('Appointment accepted successfully');
        setAcceptDialogOpen(false);
        onRefresh();
      } else {
        onError('Failed to accept appointment');
      }
    } catch (error: any) {
      onError(error?.response?.data?.message || 'Failed to accept appointment');
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleReject = async () => {
    if (!appointment || rejectReason.length < 10) return;
    try {
      setRejectLoading(true);
      const response = await clinicalApi.rejectAppointment(appointment.id, rejectReason);
      if (response.success) {
        onSuccess('Appointment rejected and returned to queue');
        setRejectDialogOpen(false);
        setRejectReason('');
        onRefresh();
      } else {
        onError('Failed to reject appointment');
      }
    } catch (error: any) {
      onError(error?.response?.data?.message || 'Failed to reject appointment');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleRefer = async () => {
    if (!appointment || !referToClinicianId) return;
    try {
      setReferLoading(true);
      const response = await clinicalApi.referAppointmentTo(
        appointment.id,
        referToClinicianId,
        referralNotes || undefined
      );
      if (response.success) {
        onSuccess('Appointment referred successfully');
        setReferDialogOpen(false);
        setReferToClinicianId('');
        setReferralNotes('');
        onRefresh();
      } else {
        onError('Failed to refer appointment');
      }
    } catch (error: any) {
      onError(error?.response?.data?.message || 'Failed to refer appointment');
    } finally {
      setReferLoading(false);
    }
  };

  // Reset forms when dialogs close
  useEffect(() => {
    if (!rejectDialogOpen) setRejectReason('');
  }, [rejectDialogOpen]);

  useEffect(() => {
    if (!referDialogOpen) {
      setReferToClinicianId('');
      setReferralNotes('');
    }
  }, [referDialogOpen]);

  return (
    <>
      {/* Accept Appointment Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Accept Appointment
            </DialogTitle>
            <DialogDescription>
              Confirm that you want to accept this appointment.
            </DialogDescription>
          </DialogHeader>

          {appointment && (
            <div className="space-y-2 py-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium text-gray-700">Patient:</div>
                <div>{appointment.patientName}</div>

                <div className="font-medium text-gray-700">CHI:</div>
                <div>{appointment.patientChiNumber || 'N/A'}</div>

                <div className="font-medium text-gray-700">Type:</div>
                <div>{appointment.appointmentType}</div>

                <div className="font-medium text-gray-700">Scheduled:</div>
                <div>
                  {new Date(appointment.scheduledDate).toLocaleDateString()} at{' '}
                  {appointment.scheduledTime || 'TBD'}
                </div>
              </div>

              {appointment.reason && (
                <div className="pt-2">
                  <div className="font-medium text-sm text-gray-700 mb-1">Reason:</div>
                  <div className="text-sm text-gray-600">{appointment.reason}</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAcceptDialogOpen(false)}
              disabled={acceptLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAccept} disabled={acceptLoading}>
              {acceptLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Appointment Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Appointment
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this appointment. The appointment will be returned to
              the queue and automatically reassigned.
            </DialogDescription>
          </DialogHeader>

          {appointment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-700">Patient:</div>
                <div>{appointment.patientName}</div>

                <div className="font-medium text-gray-700">Type:</div>
                <div>{appointment.appointmentType}</div>

                <div className="font-medium text-gray-700">Scheduled:</div>
                <div>
                  {new Date(appointment.scheduledDate).toLocaleDateString()} at{' '}
                  {appointment.scheduledTime || 'TBD'}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectReason">
                  Reason for Rejection <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejectReason"
                  placeholder="Please provide a detailed reason (minimum 10 characters)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="text-xs text-gray-500">
                  {rejectReason.length}/10 characters minimum
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={rejectLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectLoading || rejectReason.length < 10}
            >
              {rejectLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refer Appointment Dialog */}
      <Dialog open={referDialogOpen} onOpenChange={setReferDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              Refer Appointment
            </DialogTitle>
            <DialogDescription>
              Refer this appointment to another clinician within the hospital.
            </DialogDescription>
          </DialogHeader>

          {appointment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-700">Patient:</div>
                <div>{appointment.patientName}</div>

                <div className="font-medium text-gray-700">Type:</div>
                <div>{appointment.appointmentType}</div>

                <div className="font-medium text-gray-700">Scheduled:</div>
                <div>
                  {new Date(appointment.scheduledDate).toLocaleDateString()} at{' '}
                  {appointment.scheduledTime || 'TBD'}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referToClinician">
                  Refer to Clinician <span className="text-red-500">*</span>
                </Label>
                <Select value={referToClinicianId} onValueChange={setReferToClinicianId}>
                  <SelectTrigger id="referToClinician">
                    <SelectValue placeholder={cliniciansLoading ? 'Loading clinicians...' : 'Select clinician'} />
                  </SelectTrigger>
                  <SelectContent>
                    {clinicians.map((clinician) => (
                      <SelectItem key={clinician.id} value={clinician.id}>
                        {clinician.firstName} {clinician.lastName} ({clinician.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clinicians.length === 0 && !cliniciansLoading && (
                  <div className="text-xs text-amber-600">
                    No other clinicians available in this hospital
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralNotes">Referral Notes (Optional)</Label>
                <Textarea
                  id="referralNotes"
                  placeholder="Provide any relevant notes for the referred clinician"
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReferDialogOpen(false)}
              disabled={referLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefer}
              disabled={referLoading || !referToClinicianId || cliniciansLoading}
            >
              {referLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
