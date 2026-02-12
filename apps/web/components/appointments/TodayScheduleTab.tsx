'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usersApi } from '@/lib/api/users';
import type { Clinician } from '@/lib/api/users';
import { appointmentsApi } from '@/lib/api/appointments';
import { useAppointmentActions } from '@/hooks/use-appointment-actions';
import { DashboardStatsCards } from './DashboardStatsCards';
import { AppointmentCard } from './AppointmentCard';
import { getTodayDate } from '@/lib/utils/date-format';
import type { Appointment, AppointmentAction } from '@/lib/types/appointment';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TodayScheduleTabProps {
  refreshKey: number;
  onAction: (action: AppointmentAction, appointment: Appointment) => void;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export function TodayScheduleTab({ refreshKey, onAction, onRefresh, showToast }: TodayScheduleTabProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Clinician[]>([]);
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = getTodayDate();

  const fetchToday = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = { dateFrom: today, dateTo: today };
      if (doctorFilter !== 'all') params.doctorId = doctorFilter;
      const response = await appointmentsApi.getAppointments(params);
      if (response.success) {
        const sorted = [...response.data].sort(
          (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        );
        setAppointments(sorted);
      } else {
        setError('Failed to load today\'s schedule');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load today\'s schedule');
    } finally {
      setLoading(false);
    }
  }, [today, doctorFilter]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday, refreshKey]);

  useEffect(() => {
    usersApi.getClinicians().then((res) => {
      if (res.success) setDoctors(res.data);
    }).catch(() => {});
  }, []);

  const { loadingActionId, loadingActionType, checkIn, accept } = useAppointmentActions({
    onSuccess: (msg) => { showToast('success', msg); onRefresh(); },
    onError: (msg) => showToast('error', msg),
    onRefresh: fetchToday,
  });

  const stats = useMemo(() => [
    { title: 'Today Total', value: appointments.length, icon: Calendar },
    {
      title: 'In Progress',
      value: appointments.filter((a) => a.status === 'in_progress').length,
      icon: Clock,
      iconClassName: 'text-blue-500',
    },
    {
      title: 'Completed',
      value: appointments.filter((a) => a.status === 'completed').length,
      icon: CheckCircle,
      iconClassName: 'text-emerald-500',
    },
    {
      title: 'Upcoming',
      value: appointments.filter(
        (a) => (a.status === 'scheduled' || a.status === 'confirmed') && new Date(a.scheduledDate) > new Date()
      ).length,
      icon: AlertCircle,
      iconClassName: 'text-yellow-500',
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

      {/* Clinician filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by clinician:</span>
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="All clinicians" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clinicians</SelectItem>
            {doctors.map((doc) => (
              <SelectItem key={doc.id} value={doc.id}>
                {doc.firstName} {doc.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading today&apos;s schedule...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchToday}>
            Retry
          </Button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">No appointments scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              isAdmin
              loadingAction={loadingActionId === apt.id ? loadingActionType : null}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
