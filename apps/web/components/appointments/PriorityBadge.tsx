'use client';

import { Badge } from '@/components/ui/badge';
import { PRIORITY_BADGE } from '@/lib/constants/appointments';

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const info = PRIORITY_BADGE[priority] || PRIORITY_BADGE.normal;
  return <Badge className={info.className}>{info.label}</Badge>;
}
