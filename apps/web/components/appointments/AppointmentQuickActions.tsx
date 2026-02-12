'use client';

import { Button } from '@/components/ui/button';
import { CANCELLABLE_STATUSES, COMPLETABLE_STATUSES } from '@/lib/constants/appointments';
import type { Appointment, AppointmentAction } from '@/lib/types/appointment';
import {
  Eye,
  CheckCircle,
  CalendarClock,
  XCircle,
  ArrowRightLeft,
  ClipboardCheck,
  Loader2,
} from 'lucide-react';

interface AppointmentQuickActionsProps {
  appointment: Appointment;
  isAdmin: boolean;
  loadingAction?: string | null;
  onAction: (action: AppointmentAction, appointment: Appointment) => void;
}

export function AppointmentQuickActions({
  appointment,
  isAdmin,
  loadingAction,
  onAction,
}: AppointmentQuickActionsProps) {
  const isCancellable = CANCELLABLE_STATUSES.includes(appointment.status);
  const isCompletable = COMPLETABLE_STATUSES.includes(appointment.status);
  const isCheckInable = appointment.status === 'scheduled' || appointment.status === 'confirmed';
  const isPendingAcceptance = appointment.status === 'pending_acceptance';

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="View details"
        onClick={() => onAction('view', appointment)}
      >
        <Eye className="h-4 w-4" />
      </Button>

      {isPendingAcceptance && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 p-0 px-2 text-blue-600 hover:text-blue-700 gap-1"
          title="Accept"
          disabled={loadingAction === 'accept'}
          onClick={() => onAction('accept', appointment)}
        >
          {loadingAction === 'accept' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <span className="text-xs">Accept</span>
        </Button>
      )}

      {isCheckInable && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 p-0 px-2 text-emerald-600 hover:text-emerald-700 gap-1"
          title="Check In"
          disabled={loadingAction === 'check_in'}
          onClick={() => onAction('check_in', appointment)}
        >
          {loadingAction === 'check_in' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <span className="text-xs">Check In</span>
        </Button>
      )}

      {isCompletable && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 p-0 px-2 text-blue-600 hover:text-blue-700 gap-1"
          title="Complete"
          onClick={() => onAction('complete', appointment)}
        >
          <ClipboardCheck className="h-4 w-4" />
          <span className="text-xs">Complete</span>
        </Button>
      )}

      {isCancellable && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title={isAdmin ? 'Reschedule' : 'Request Reschedule'}
            onClick={() => onAction('reschedule', appointment)}
          >
            <CalendarClock className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            title={isAdmin ? 'Cancel' : 'Request Cancellation'}
            onClick={() => onAction('cancel', appointment)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Refer"
            onClick={() => onAction('refer', appointment)}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
