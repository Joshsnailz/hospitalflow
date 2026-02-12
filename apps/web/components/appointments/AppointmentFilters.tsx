'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TYPE_LABELS } from '@/lib/constants/appointments';
import type { AppointmentType } from '@/lib/types/appointment';
import type { Clinician } from '@/lib/api/users';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface AppointmentFilterValues {
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  doctorFilter: string;
  dateFrom: string;
  dateTo: string;
}

interface AppointmentFiltersProps {
  filters: AppointmentFilterValues;
  onFiltersChange: (filters: AppointmentFilterValues) => void;
  onRefresh: () => void;
  doctors?: Clinician[];
  showDoctorFilter?: boolean;
}

export function AppointmentFilters({
  filters,
  onFiltersChange,
  onRefresh,
  doctors = [],
  showDoctorFilter = true,
}: AppointmentFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters =
    filters.statusFilter !== 'all' ||
    filters.typeFilter !== 'all' ||
    filters.doctorFilter !== 'all' ||
    filters.dateFrom ||
    filters.dateTo;

  const update = (patch: Partial<AppointmentFilterValues>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: filters.searchQuery,
      statusFilter: 'all',
      typeFilter: 'all',
      doctorFilter: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Search row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by patient name, CHI number, doctor, or reason..."
                value={filters.searchQuery}
                onChange={(e) => update({ searchQuery: e.target.value })}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 text-[10px]">
                    !
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Advanced filters */}
          {showAdvanced && (
            <div className="grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={filters.statusFilter} onValueChange={(v) => update({ statusFilter: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending_acceptance">Pending Acceptance</SelectItem>
                    <SelectItem value="pending_reschedule">Pending Reschedule</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={filters.typeFilter} onValueChange={(v) => update({ typeFilter: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {(Object.keys(TYPE_LABELS) as AppointmentType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {showDoctorFilter && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Clinician</Label>
                  <Select value={filters.doctorFilter} onValueChange={(v) => update({ doctorFilter: v })}>
                    <SelectTrigger>
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
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">From Date</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => update({ dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To Date</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => update({ dateTo: e.target.value })}
                />
              </div>
              {hasActiveFilters && (
                <div className="flex items-end lg:col-span-5">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
