'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { AppointmentTypeBadge } from './AppointmentTypeBadge';
import { AppointmentQuickActions } from './AppointmentQuickActions';
import { formatDate, formatTime } from '@/lib/utils/date-format';
import type { Appointment, AppointmentAction } from '@/lib/types/appointment';
import { ChevronUp, ChevronDown, Loader2, AlertCircle, Calendar, Plus } from 'lucide-react';

type SortField = 'scheduledDate' | 'patientName' | 'doctorName' | 'appointmentType' | 'status';
type SortDir = 'asc' | 'desc';

interface AppointmentTableProps {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  loadingActionId?: string | null;
  loadingActionType?: string | null;
  searchQuery?: string;
  onAction: (action: AppointmentAction, appointment: Appointment) => void;
  onRetry?: () => void;
  onCreateNew?: () => void;
  emptyMessage?: string;
}

export function AppointmentTable({
  appointments,
  loading,
  error,
  isAdmin,
  loadingActionId,
  loadingActionType,
  searchQuery = '',
  onAction,
  onRetry,
  onCreateNew,
  emptyMessage,
}: AppointmentTableProps) {
  const [sortField, setSortField] = useState<SortField>('scheduledDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filteredAndSorted = useMemo(() => {
    let result = appointments;

    // Client-side search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (apt) =>
          (apt.patientName?.toLowerCase() || '').includes(q) ||
          (apt.patientChi?.toLowerCase() || '').includes(q) ||
          (apt.doctorName?.toLowerCase() || '').includes(q) ||
          (apt.reason?.toLowerCase() || '').includes(q)
      );
    }

    // Sort
    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'scheduledDate':
          cmp = a.scheduledDate.localeCompare(b.scheduledDate);
          break;
        case 'patientName':
          cmp = (a.patientName || '').localeCompare(b.patientName || '');
          break;
        case 'doctorName':
          cmp = (a.doctorName || '').localeCompare(b.doctorName || '');
          break;
        case 'appointmentType':
          cmp = a.appointmentType.localeCompare(b.appointmentType);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [appointments, searchQuery, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 inline" />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading appointments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-red-600 font-medium">{error}</p>
            {onRetry && (
              <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredAndSorted.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-muted-foreground">
              {emptyMessage || 'No appointments found'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'Create a new appointment to get started.'}
            </p>
            {onCreateNew && !searchQuery && (
              <Button className="mt-4 gap-2" onClick={onCreateNew}>
                <Plus className="h-4 w-4" />
                New Appointment
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('patientName')}>
                Patient <SortIcon field="patientName" />
              </TableHead>
              <TableHead>CHI Number</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('doctorName')}>
                Doctor <SortIcon field="doctorName" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('appointmentType')}>
                Type <SortIcon field="appointmentType" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('scheduledDate')}>
                Date / Time <SortIcon field="scheduledDate" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                Status <SortIcon field="status" />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.map((apt) => (
              <TableRow key={apt.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {apt.patientName || apt.emergencyAlias || 'Unknown Patient'}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{apt.patientChi || '-'}</TableCell>
                <TableCell>{apt.doctorName ? `Dr ${apt.doctorName}` : '-'}</TableCell>
                <TableCell>
                  <AppointmentTypeBadge type={apt.appointmentType} scenario={apt.scenario} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{formatDate(apt.scheduledDate)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(apt.scheduledDate)}
                      {apt.durationMinutes ? ` (${apt.durationMinutes} min)` : ''}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <AppointmentStatusBadge status={apt.status} />
                </TableCell>
                <TableCell className="text-right">
                  <AppointmentQuickActions
                    appointment={apt}
                    isAdmin={isAdmin}
                    loadingAction={loadingActionId === apt.id ? loadingActionType : null}
                    onAction={onAction}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
