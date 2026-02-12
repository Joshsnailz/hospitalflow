'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { canCreateAppointments, isClinician } from '@/lib/permissions';
import { Plus, UserCheck } from 'lucide-react';

interface AppointmentsHeaderProps {
  role: string | undefined;
}

export function AppointmentsHeader({ role }: AppointmentsHeaderProps) {
  const router = useRouter();
  const showCreate = canCreateAppointments(role);
  const isClinicianRole = isClinician(role);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground">
          {isClinicianRole
            ? 'Your schedule and patient appointments'
            : 'Manage and track patient appointments across departments'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => router.push('/appointments/walk-in')}
          className="gap-2"
        >
          <UserCheck className="h-4 w-4" />
          Walk-in
        </Button>
        {showCreate && (
          <Button onClick={() => router.push('/appointments/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        )}
      </div>
    </div>
  );
}
