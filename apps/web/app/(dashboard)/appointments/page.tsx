'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { usersApi } from '@/lib/api/users';
import type { Clinician } from '@/lib/api/users';
import { appointmentsApi } from '@/lib/api/appointments';
import { isAdmin as isAdminRole } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import type { Appointment, AppointmentAction } from '@/lib/types/appointment';
import {
  AppointmentsHeader,
  AppointmentsTabs,
  AdminOverviewTab,
  MyScheduleTab,
  TodayScheduleTab,
  QueueTab,
  RequestsTab,
  ToastContainer,
  ViewAppointmentDialog,
  RescheduleDialog,
  CancelDialog,
  ReferDialog,
  CompleteDialog,
  DueAppointmentDialog,
} from '@/components/appointments';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const admin = isAdminRole(user?.role);

  // Tab state from URL
  const tabParam = searchParams.get('tab');
  const defaultTab = admin ? 'overview' : 'my-schedule';
  const [activeTab, setActiveTab] = useState(tabParam || defaultTab);

  // Sync tab param on initial load / when role changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      setActiveTab(admin ? 'overview' : 'my-schedule');
    }
  }, [admin, tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/appointments?${params.toString()}`, { scroll: false });
  };

  // Shared state
  const { toast, showToast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Doctors for dialogs
  const [doctors, setDoctors] = useState<Clinician[]>([]);
  useEffect(() => {
    usersApi.getClinicians().then((res) => {
      if (res.success) setDoctors(res.data);
    }).catch(() => {});
  }, []);

  // Badge counts
  const [queueCount, setQueueCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);

  useEffect(() => {
    // Fetch queue count
    appointmentsApi.getAppointmentQueue().then((res) => {
      if (res.success) setQueueCount(res.data.length);
    }).catch(() => {});

    // Fetch pending requests count (admin only)
    if (admin) {
      appointmentsApi.getRescheduleRequests().then((res) => {
        if (res.success) {
          setRequestsCount(res.data.filter((r) => r.status === 'pending').length);
        }
      }).catch(() => {});
    }
  }, [admin, refreshKey]);

  // Dialog state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [referOpen, setReferOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);
  const [dueAppointment, setDueAppointment] = useState<Appointment | null>(null);

  const handleAction = useCallback((action: AppointmentAction, appointment: Appointment) => {
    setSelectedAppointment(appointment);
    switch (action) {
      case 'view':
        setViewOpen(true);
        break;
      case 'reschedule':
        setRescheduleOpen(true);
        break;
      case 'cancel':
        setCancelOpen(true);
        break;
      case 'refer':
        setReferOpen(true);
        break;
      case 'complete':
        setCompleteOpen(true);
        break;
    }
  }, []);

  const handleDialogSuccess = useCallback((message: string) => {
    showToast('success', message);
    triggerRefresh();
  }, [showToast, triggerRefresh]);

  const handleDialogError = useCallback((message: string) => {
    showToast('error', message);
  }, [showToast]);

  const handleDueAppointment = useCallback((apt: Appointment) => {
    setDueAppointment(apt);
    setDueOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      <ToastContainer toast={toast} />
      <AppointmentsHeader role={user?.role} />

      <AppointmentsTabs
        role={user?.role}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        queueCount={queueCount}
        requestsCount={requestsCount}
      >
        {{
          overview: (
            <AdminOverviewTab
              refreshKey={refreshKey}
              onAction={handleAction}
              onRefresh={triggerRefresh}
              showToast={showToast}
            />
          ),
          today: (
            <TodayScheduleTab
              refreshKey={refreshKey}
              onAction={handleAction}
              onRefresh={triggerRefresh}
              showToast={showToast}
            />
          ),
          mySchedule: (
            <MyScheduleTab
              refreshKey={refreshKey}
              onAction={handleAction}
              onRefresh={triggerRefresh}
              showToast={showToast}
              onDueAppointment={handleDueAppointment}
            />
          ),
          queue: (
            <QueueTab
              refreshKey={refreshKey}
              onRefresh={triggerRefresh}
              showToast={showToast}
            />
          ),
          requests: (
            <RequestsTab
              refreshKey={refreshKey}
              onRefresh={triggerRefresh}
              showToast={showToast}
            />
          ),
        }}
      </AppointmentsTabs>

      {/* Shared dialogs */}
      <ViewAppointmentDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        appointment={selectedAppointment}
      />
      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        appointment={selectedAppointment}
        isAdmin={admin}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />
      <CancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        appointment={selectedAppointment}
        isAdmin={admin}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />
      <ReferDialog
        open={referOpen}
        onOpenChange={setReferOpen}
        appointment={selectedAppointment}
        doctors={doctors}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />
      <CompleteDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        appointment={selectedAppointment}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />
      <DueAppointmentDialog
        open={dueOpen}
        onOpenChange={setDueOpen}
        appointment={dueAppointment}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
        onReschedule={(apt) => {
          setSelectedAppointment(apt);
          setRescheduleOpen(true);
        }}
        onCancel={(apt) => {
          setSelectedAppointment(apt);
          setCancelOpen(true);
        }}
      />
    </div>
  );
}
