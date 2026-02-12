'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { appointmentsApi } from '@/lib/api/appointments';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { PRIORITY_ORDER, PRIORITY_BADGE, SCENARIO_BADGE, TYPE_LABELS } from '@/lib/constants/appointments';
import { formatDateTime, timeAgo } from '@/lib/utils/date-format';
import { DashboardStatsCards } from './DashboardStatsCards';
import type { Appointment } from '@/lib/types/appointment';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface QueueTabProps {
  refreshKey: number;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export function QueueTab({ refreshKey, onRefresh, showToast }: QueueTabProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const sortQueue = (data: Appointment[]) =>
    [...data].sort((a, b) => {
      const pA = PRIORITY_ORDER[a.priority] ?? 2;
      const pB = PRIORITY_ORDER[b.priority] ?? 2;
      if (pA !== pB) return pA - pB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentsApi.getAppointmentQueue();
      if (response.success) {
        setAppointments(sortQueue(response.data));
      } else {
        setError('Failed to load appointment queue');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load appointment queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue, refreshKey]);

  // Auto-refresh (silent)
  useAutoRefresh(() => {
    appointmentsApi.getAppointmentQueue().then((response) => {
      if (response.success) setAppointments(sortQueue(response.data));
    }).catch(() => {});
  }, 30000);

  const handleAccept = async (apt: Appointment) => {
    try {
      setAcceptingId(apt.id);
      const response = await appointmentsApi.acceptAppointment(apt.id);
      const data = response.data;
      if ((apt.scenario === 'emergency' || apt.scenario === 'walk_in') && data?.dischargeForm?.id) {
        showToast('success', 'Appointment accepted. Opening discharge form...');
        router.push(`/discharge/${data.dischargeForm.id}`);
      } else {
        showToast('success', `Appointment for ${apt.patientName || apt.emergencyAlias || 'Unknown Patient'} accepted`);
        fetchQueue();
        onRefresh();
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to accept appointment');
    } finally {
      setAcceptingId(null);
    }
  };

  const stats = useMemo(() => [
    { title: 'Total in Queue', value: appointments.length, icon: Clock },
    {
      title: 'Urgent',
      value: appointments.filter((a) => a.priority === 'urgent').length,
      icon: AlertCircle,
      iconClassName: 'text-red-500',
      valueClassName: 'text-red-600',
    },
    {
      title: 'High Priority',
      value: appointments.filter((a) => a.priority === 'high').length,
      icon: AlertCircle,
      iconClassName: 'text-orange-500',
      valueClassName: 'text-orange-600',
    },
    {
      title: 'Emergencies',
      value: appointments.filter((a) => a.scenario === 'emergency').length,
      icon: AlertCircle,
      iconClassName: 'text-destructive',
    },
  ], [appointments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Auto-refreshes every 30s
        </div>
        <Button variant="outline" size="sm" onClick={fetchQueue} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DashboardStatsCards items={stats} />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading queue...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={fetchQueue}>
                Retry
              </Button>
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle className="h-10 w-10 text-emerald-400 mb-3" />
              <p className="font-medium text-muted-foreground">Queue is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                No appointments are currently pending acceptance.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>CHI</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Scenario</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt) => {
                  const priorityInfo = PRIORITY_BADGE[apt.priority] || PRIORITY_BADGE.normal;
                  const scenarioInfo = SCENARIO_BADGE[apt.scenario];
                  const isAccepting = acceptingId === apt.id;

                  return (
                    <TableRow key={apt.id} className={apt.priority === 'urgent' ? 'border-l-4 border-l-red-500' : apt.priority === 'high' ? 'border-l-4 border-l-orange-500' : ''}>
                      <TableCell className="font-medium">
                        {apt.patientName || apt.emergencyAlias || 'Unknown Patient'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{apt.patientChi || '-'}</TableCell>
                      <TableCell>{apt.doctorName ? `Dr ${apt.doctorName}` : '-'}</TableCell>
                      <TableCell>{TYPE_LABELS[apt.appointmentType] || apt.appointmentType}</TableCell>
                      <TableCell>
                        <Badge className={priorityInfo.className}>{priorityInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={scenarioInfo.variant}>{scenarioInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{formatDateTime(apt.createdAt)}</span>
                          <span className="text-xs text-muted-foreground">{timeAgo(apt.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="gap-1" disabled={isAccepting} onClick={() => handleAccept(apt)}>
                          {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Accept
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
