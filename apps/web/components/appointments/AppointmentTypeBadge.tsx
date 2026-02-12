'use client';

import { Badge } from '@/components/ui/badge';
import { TYPE_LABELS, SCENARIO_BADGE } from '@/lib/constants/appointments';
import type { AppointmentType, AppointmentScenario } from '@/lib/types/appointment';

interface AppointmentTypeBadgeProps {
  type: AppointmentType;
  scenario?: AppointmentScenario;
}

export function AppointmentTypeBadge({ type, scenario }: AppointmentTypeBadgeProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{TYPE_LABELS[type] || type}</span>
      {scenario && scenario !== 'scheduled' && (
        <Badge variant={SCENARIO_BADGE[scenario].variant} className="text-[10px] px-1.5 py-0">
          {SCENARIO_BADGE[scenario].label}
        </Badge>
      )}
    </div>
  );
}
