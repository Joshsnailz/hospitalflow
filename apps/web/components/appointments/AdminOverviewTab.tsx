'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { appointmentsApi } from '@/lib/api/appointments';
import { usersApi } from '@/lib/api/users';
import type { Clinician } from '@/lib/api/users';
import type { Appointment, AppointmentAction } from '@/lib/types/appointment';
import { useAppointments } from '@/hooks/use-appointments';
import { useAppointmentActions } from '@/hooks/use-appointment-actions';
import { DashboardStatsCards } from './DashboardStatsCards';
import { AppointmentFilters, type AppointmentFilterValues } from './AppointmentFilters';
import { AppointmentTable } from './AppointmentTable';
import { Calendar, Clock, CalendarClock, XCircle } from 'lucide-react';

interface AdminOverviewTabProps {
  refreshKey: number;
  onAction: (action: AppointmentAction, appointment: Appointment) => void;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export function AdminOverviewTab({ refreshKey, onAction, onRefresh, showToast }: AdminOverviewTabProps) {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Clinician[]>([]);
  const [filters, setFilters] = useState<AppointmentFilterValues>({
    searchQuery: '',
    statusFilter: 'all',
    typeFilter: 'all',
    doctorFilter: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const { appointments, loading, error, refresh } = useAppointments({
    status: filters.statusFilter,
    appointmentType: filters.typeFilter,
    doctorId: filters.doctorFilter,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    refreshKey,
  });

  const { loadingActionId, loadingActionType, checkIn, accept } = useAppointmentActions({
    onSuccess: (msg) => { showToast('success', msg); onRefresh(); },
    onError: (msg) => showToast('error', msg),
    onRefresh: refresh,
  });

  useEffect(() => {
    usersApi.getClinicians().then((res) => {
      if (res.success) setDoctors(res.data);
    }).catch(() => {});
  }, []);

  const stats = useMemo(() => [
    { title: 'Total', value: appointments.length, icon: Calendar },
    {
      title: 'Scheduled',
      value: appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length,
      icon: Clock,
      iconClassName: 'text-blue-500',
    },
    {
      title: 'Completed',
      value: appointments.filter((a) => a.status === 'completed').length,
      icon: CalendarClock,
      iconClassName: 'text-emerald-500',
    },
    {
      title: 'Cancelled',
      value: appointments.filter((a) => a.status === 'cancelled').length,
      icon: XCircle,
      iconClassName: 'text-red-500',
    },
  ], [appointments]);

  const handleAction = (action: AppointmentAction, apt: Appointment) => {
    switch (action) {
      case 'check_in':
        checkIn(apt);
        break;
      case 'accept':
        accept(apt);
        break;
      default:
        onAction(action, apt);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardStatsCards items={stats} />
      <AppointmentFilters
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refresh}
        doctors={doctors}
        showDoctorFilter
      />
      <AppointmentTable
        appointments={appointments}
        loading={loading}
        error={error}
        isAdmin
        loadingActionId={loadingActionId}
        loadingActionType={loadingActionType}
        searchQuery={filters.searchQuery}
        onAction={handleAction}
        onRetry={refresh}
        onCreateNew={() => router.push('/appointments/new')}
      />
    </div>
  );
}
