'use client';

import { Badge } from '@/components/ui/badge';
import { STATUS_BADGE_MAP } from '@/lib/constants/appointments';
import type { AppointmentStatus } from '@/lib/types/appointment';

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const info = STATUS_BADGE_MAP[status];
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
