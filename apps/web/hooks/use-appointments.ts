'use client';

import { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '@/lib/api/appointments';
import type { Appointment } from '@/lib/types/appointment';

interface UseAppointmentsOptions {
  status?: string;
  appointmentType?: string;
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  refreshKey?: number;
}

interface UseAppointmentsResult {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  total: number;
}

export function useAppointments(options: UseAppointmentsOptions = {}): UseAppointmentsResult {
  const { status, appointmentType, doctorId, dateFrom, dateTo, refreshKey } = options;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = {};
      if (status && status !== 'all') params.status = status;
      if (appointmentType && appointmentType !== 'all') params.appointmentType = appointmentType;
      if (doctorId && doctorId !== 'all') params.doctorId = doctorId;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await appointmentsApi.getAppointments(params);
      if (response.success) {
        setAppointments(response.data);
      } else {
        setError('Failed to load appointments');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [status, appointmentType, doctorId, dateFrom, dateTo]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments, refreshKey]);

  return {
    appointments,
    loading,
    error,
    refresh: fetchAppointments,
    total: appointments.length,
  };
}
