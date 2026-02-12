'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { AppointmentTypeBadge } from './AppointmentTypeBadge';
import { PriorityBadge } from './PriorityBadge';
import { AppointmentQuickActions } from './AppointmentQuickActions';
import { formatTime } from '@/lib/utils/date-format';
import type { Appointment, AppointmentAction } from '@/lib/types/appointment';
import { Clock } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  isAdmin: boolean;
  loadingAction?: string | null;
  onAction: (action: AppointmentAction, appointment: Appointment) => void;
}

const PRIORITY_BORDER: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-500',
  normal: 'border-l-blue-400',
  low: 'border-l-gray-300',
};

export function AppointmentCard({
  appointment,
  isAdmin,
  loadingAction,
  onAction,
}: AppointmentCardProps) {
  const isActive = appointment.status === 'in_progress';
  const isFaded = appointment.status === 'completed' || appointment.status === 'cancelled';
  const borderColor = PRIORITY_BORDER[appointment.priority] || PRIORITY_BORDER.normal;

  return (
    <Card
      className={`border-l-4 ${borderColor} ${
        isActive ? 'ring-2 ring-blue-200 bg-blue-50/50 dark:bg-blue-950/20' : ''
      } ${isFaded ? 'opacity-60' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Time + Patient */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground shrink-0">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(appointment.scheduledDate)}
              </div>
              <span className="font-semibold truncate">
                {appointment.patientName || appointment.emergencyAlias || 'Unknown Patient'}
              </span>
            </div>

            {/* Type + Status + Priority */}
            <div className="flex items-center gap-2 flex-wrap">
              <AppointmentTypeBadge type={appointment.appointmentType} scenario={appointment.scenario} />
              <AppointmentStatusBadge status={appointment.status} />
              <PriorityBadge priority={appointment.priority} />
            </div>

            {/* Doctor + Duration */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {appointment.doctorName && (
                <span>Dr {appointment.doctorName}</span>
              )}
              {appointment.durationMinutes && (
                <span>{appointment.durationMinutes} min</span>
              )}
            </div>

            {/* Reason */}
            {appointment.reason && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {appointment.reason}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="shrink-0">
            <AppointmentQuickActions
              appointment={appointment}
              isAdmin={isAdmin}
              loadingAction={loadingAction}
              onAction={onAction}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
