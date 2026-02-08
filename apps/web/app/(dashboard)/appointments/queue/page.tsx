'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { clinicalApi } from '@/lib/api/clinical';
import type { Appointment, AppointmentStatus } from '@/lib/types/clinical';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ListOrdered,
  Loader2,
  RefreshCw,
  Eye,
  ArrowUpDown,
  Filter,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function AppointmentQueuePage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  // Stats
  const totalInQueue = appointments.length;
  const unassignedCount = appointments.filter(a => !a.assignedToId).length;
  const assignedCount = appointments.filter(a => a.assignedToId && !a.acceptedById).length;
  const acceptedCount = appointments.filter(a => a.acceptedById).length;

  const fetchQueueAppointments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch appointments in queue (pending or scheduled)
      const response = await clinicalApi.getAppointments({
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy: 'queuePosition',
        sortOrder: 'ASC',
        limit: 100,
      });

      // Filter by assignment status if specified
      let filtered = response.data;
      if (assignmentFilter === 'assigned') {
        filtered = filtered.filter(a => a.assignedToId && !a.acceptedById);
      } else if (assignmentFilter === 'unassigned') {
        filtered = filtered.filter(a => !a.assignedToId);
      }

      setAppointments(filtered);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load queue');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, assignmentFilter]);

  useEffect(() => {
    fetchQueueAppointments();
  }, [fetchQueueAppointments]);

  const getStatusBadge = (status: AppointmentStatus) => {
    const statusConfig: Record<AppointmentStatus, { color: string; label: string }> = {
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      checked_in: { color: 'bg-green-100 text-green-800', label: 'Checked In' },
      in_progress: { color: 'bg-purple-100 text-purple-800', label: 'In Progress' },
      completed: { color: 'bg-emerald-100 text-emerald-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      no_show: { color: 'bg-gray-100 text-gray-800', label: 'No Show' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getAssignmentBadge = (appointment: Appointment) => {
    if (appointment.acceptedById) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Accepted
        </Badge>
      );
    } else if (appointment.assignedToId) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Clock className="mr-1 h-3 w-3" />
          Assigned
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-300">
          <AlertCircle className="mr-1 h-3 w-3" />
          Unassigned
        </Badge>
      );
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ListOrdered className="h-8 w-8" />
          Appointment Queue
        </h1>
        <p className="text-muted-foreground">
          Manage and monitor the appointment queue across all hospitals
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total in Queue</CardTitle>
            <ListOrdered className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInQueue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unassignedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assignedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{acceptedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Queue Management</CardTitle>
              <CardDescription>View and manage appointments in the queue</CardDescription>
            </div>
            <Button onClick={fetchQueueAppointments} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={assignmentFilter} onValueChange={(value) => setAssignmentFilter(value as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignments</SelectItem>
                <SelectItem value="unassigned">Unassigned Only</SelectItem>
                <SelectItem value="assigned">Assigned Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-600">{error}</div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No appointments in queue matching the selected filters
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">
                      <div className="flex items-center gap-1">
                        <ListOrdered className="h-4 w-4" />
                        Queue #
                      </div>
                    </TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Scheduled
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Assigned To
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        Hospital
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {appointment.queuePosition !== null ? (
                          <Badge variant="outline">#{appointment.queuePosition}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{appointment.patientName || 'Unknown'}</div>
                          {appointment.patientChiNumber && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {appointment.patientChiNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-sm">
                          {appointment.type?.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDateTime(`${appointment.scheduledDate}T${appointment.scheduledTime}`)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                      <TableCell>{getAssignmentBadge(appointment)}</TableCell>
                      <TableCell>
                        {appointment.assignedToName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {appointment.hospitalName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/appointments/${appointment.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
