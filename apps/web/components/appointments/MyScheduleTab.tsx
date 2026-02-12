'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { appointmentsApi } from '@/lib/api/appointments';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { useAppointmentActions } from '@/hooks/use-appointment-actions';
import { DashboardStatsCards } from './DashboardStatsCards';
import { AppointmentCard } from './AppointmentCard';
import { getTodayDate } from '@/lib/utils/date-format';
import type { Appointment, AppointmentAction } from '@/lib/types/appointment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface MyScheduleTabProps {
  refreshKey: number;
  onAction: (action: AppointmentAction, appointment: Appointment) => void;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
  onDueAppointment: (appointment: Appointment) => void;
}

export function MyScheduleTab({
  refreshKey,
  onAction,
  onRefresh,
  showToast,
  onDueAppointment,
}: MyScheduleTabProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDueId, setLastDueId] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentsApi.getAppointments({
        doctorId: user.id,
        dateFrom: selectedDate,
        dateTo: selectedDate,
      });
      if (response.success) {
        // Sort chronologically
        const sorted = [...response.data].sort(
          (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        );
        setAppointments(sorted);
      } else {
        setError('Failed to load schedule');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedDate]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule, refreshKey]);

  // Check for due appointments
  const checkDue = useCallback(() => {
    const now = new Date();
    const due = appointments.find(
      (apt) =>
        apt.scenario === 'scheduled' &&
        apt.status === 'confirmed' &&
        new Date(apt.scheduledDate) <= now &&
        now.getTime() - new Date(apt.scheduledDate).getTime() < 2 * 60 * 60 * 1000
    );
    if (due && due.id !== lastDueId) {
      setLastDueId(due.id);
      onDueAppointment(due);
    }
  }, [appointments, lastDueId, onDueAppointment]);

  // Poll for due appointments and silent refresh
  useAutoRefresh(() => {
    checkDue();
    // Silent refresh
    if (user?.id) {
      appointmentsApi
        .getAppointments({ doctorId: user.id, dateFrom: selectedDate, dateTo: selectedDate })
        .then((res) => {
          if (res.success) {
            const sorted = [...res.data].sort(
              (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
            );
            setAppointments(sorted);
          }
        })
        .catch(() => {});
    }
  }, 30000);

  // Check due on initial load
  useEffect(() => {
    if (appointments.length > 0) checkDue();
  }, [appointments, checkDue]);

  const { loadingActionId, loadingActionType, checkIn, accept } = useAppointmentActions({
    onSuccess: (msg) => { showToast('success', msg); onRefresh(); },
    onError: (msg) => showToast('error', msg),
    onRefresh: fetchSchedule,
  });

  const isToday = selectedDate === getTodayDate();

  const stats = useMemo(() => {
    const todayApts = appointments;
    return [
      {
        title: isToday ? 'My Today' : 'Appointments',
        value: todayApts.length,
        icon: Calendar,
      },
      {
        title: 'In Progress',
        value: todayApts.filter((a) => a.status === 'in_progress').length,
        icon: Clock,
        iconClassName: 'text-blue-500',
      },
      {
        title: 'Completed',
        value: todayApts.filter((a) => a.status === 'completed').length,
        icon: CheckCircle,
        iconClassName: 'text-emerald-500',
      },
      {
        title: 'Upcoming',
        value: todayApts.filter(
          (a) =>
            (a.status === 'scheduled' || a.status === 'confirmed') &&
            new Date(a.scheduledDate) > new Date()
        ).length,
        icon: AlertCircle,
        iconClassName: 'text-yellow-500',
      },
    ];
  }, [appointments, isToday]);

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

  const navigateDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      <DashboardStatsCards items={stats} />

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
        <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isToday && (
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(getTodayDate())}>
            Today
          </Button>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading schedule...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchSchedule}>
            Retry
          </Button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">
            {isToday ? 'No appointments scheduled for today' : 'No appointments on this date'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              isAdmin={false}
              loadingAction={loadingActionId === apt.id ? loadingActionType : null}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
