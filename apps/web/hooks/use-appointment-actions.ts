'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appointmentsApi } from '@/lib/api/appointments';
import type { Appointment } from '@/lib/types/appointment';

interface UseAppointmentActionsOptions {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

export function useAppointmentActions({ onSuccess, onError, onRefresh }: UseAppointmentActionsOptions) {
  const router = useRouter();
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [loadingActionType, setLoadingActionType] = useState<string | null>(null);

  const withLoading = async (id: string, type: string, fn: () => Promise<void>) => {
    try {
      setLoadingActionId(id);
      setLoadingActionType(type);
      await fn();
      onRefresh();
    } finally {
      setLoadingActionId(null);
      setLoadingActionType(null);
    }
  };

  const checkIn = async (apt: Appointment) => {
    await withLoading(apt.id, 'check_in', async () => {
      await appointmentsApi.checkInAppointment(apt.id);
      onSuccess(`${apt.patientName || 'Patient'} checked in successfully`);
    });
  };

  const accept = async (apt: Appointment) => {
    await withLoading(apt.id, 'accept', async () => {
      try {
        const response = await appointmentsApi.acceptAppointment(apt.id);
        const data = response.data;
        if ((apt.scenario === 'emergency' || apt.scenario === 'walk_in') && data?.dischargeForm?.id) {
          onSuccess('Appointment accepted. Opening discharge form...');
          router.push(`/discharge/${data.dischargeForm.id}`);
        } else {
          onSuccess('Appointment accepted');
        }
      } catch (err: any) {
        onError(err?.response?.data?.message || 'Failed to accept appointment');
      }
    });
  };

  const attend = async (apt: Appointment) => {
    await withLoading(apt.id, 'attend', async () => {
      try {
        const response = await appointmentsApi.attendAppointment(apt.id);
        const data = response.data;
        if (data?.dischargeForm?.id) {
          onSuccess('Attending patient. Opening discharge form...');
          router.push(`/discharge/${data.dischargeForm.id}`);
        } else {
          onSuccess('Now attending patient');
        }
      } catch (err: any) {
        onError(err?.response?.data?.message || 'Failed to attend appointment');
      }
    });
  };

  return {
    loadingActionId,
    loadingActionType,
    checkIn,
    accept,
    attend,
  };
}
