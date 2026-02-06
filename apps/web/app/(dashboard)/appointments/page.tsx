'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { clinicalApi } from '@/lib/api/clinical';
import { hospitalsApi } from '@/lib/api/hospitals';
import { usersApi } from '@/lib/api/users';
import type { Appointment, AppointmentStatus, AppointmentType } from '@/lib/types/clinical';
import type { Hospital, Department, Ward, Bed } from '@/lib/types/hospital';
import type { User } from '@/lib/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  CalendarClock,
  XCircle,
  ArrowRightLeft,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  ClipboardCheck,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// -- helpers ------------------------------------------------------------------

const STATUS_BADGE_MAP: Record<AppointmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }> = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'destructive' },
  rescheduled: { label: 'Rescheduled', variant: 'secondary' },
};

const TYPE_LABELS: Record<AppointmentType, string> = {
  consultation: 'Consultation',
  follow_up: 'Follow-up',
  emergency: 'Emergency',
  procedure: 'Procedure',
  lab_review: 'Lab Review',
  imaging_review: 'Imaging Review',
  referral: 'Referral',
  check_up: 'Check-up',
};

type SortField = 'scheduledDate' | 'patientName' | 'doctorName' | 'type' | 'status';
type SortDir = 'asc' | 'desc';

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  // Handle HH:mm or HH:mm:ss
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }
  return timeStr;
}

// -- component ----------------------------------------------------------------

export default function AppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortField, setSortField] = useState<SortField>('scheduledDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Dialogs
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [referDialogOpen, setReferDialogOpen] = useState(false);

  // Reschedule form
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Cancel form
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Refer form
  const [referDoctor, setReferDoctor] = useState('');
  const [referDepartment, setReferDepartment] = useState('');
  const [referReason, setReferReason] = useState('');
  const [referLoading, setReferLoading] = useState(false);

  // Check-in loading state (per-appointment)
  const [checkInLoadingId, setCheckInLoadingId] = useState<string | null>(null);

  // Complete appointment dialog
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeDecision, setCompleteDecision] = useState<'discharge' | 'admit'>('discharge');
  const [completeEncounterType, setCompleteEncounterType] = useState<string>('inpatient');
  const [completeChiefComplaint, setCompleteChiefComplaint] = useState('');
  const [completeAdmissionDiagnosis, setCompleteAdmissionDiagnosis] = useState('');

  // Cascading selects for admission (shared between complete dialog)
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [bedsLoading, setBedsLoading] = useState(false);

  // Toast-like feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch data
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (doctorFilter !== 'all') params.doctorId = doctorFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await clinicalApi.getAppointments(params);
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
  }, [statusFilter, typeFilter, doctorFilter, dateFrom, dateTo]);

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await usersApi.findAll({ role: 'doctor', limit: 200 });
      if (response.success) {
        setDoctors(response.data);
      }
    } catch {
      // Non-critical - doctors list used for filtering and referrals
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [fetchAppointments, fetchDoctors]);

  // Client-side search filtering and sorting
  const filteredAppointments = appointments
    .filter((apt) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (apt.patientName?.toLowerCase() || '').includes(q) ||
        (apt.patientChiNumber?.toLowerCase() || '').includes(q) ||
        (apt.doctorName?.toLowerCase() || '').includes(q) ||
        (apt.reason?.toLowerCase() || '').includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'scheduledDate':
          cmp = `${a.scheduledDate}T${a.scheduledTime}`.localeCompare(`${b.scheduledDate}T${b.scheduledTime}`);
          break;
        case 'patientName':
          cmp = (a.patientName || '').localeCompare(b.patientName || '');
          break;
        case 'doctorName':
          cmp = (a.doctorName || '').localeCompare(b.doctorName || '');
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  // Sort toggle
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

  // -- dialog actions ---------------------------------------------------------

  const openViewDialog = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setViewDialogOpen(true);
  };

  const openRescheduleDialog = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setRescheduleDate(apt.scheduledDate);
    setRescheduleTime(apt.scheduledTime);
    setRescheduleReason('');
    setRescheduleDialogOpen(true);
  };

  const openCancelDialog = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const openReferDialog = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setReferDoctor('');
    setReferDepartment('');
    setReferReason('');
    setReferDialogOpen(true);
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;
    try {
      setRescheduleLoading(true);
      await clinicalApi.rescheduleAppointment(selectedAppointment.id, {
        scheduledDate: rescheduleDate,
        scheduledTime: rescheduleTime,
        reason: rescheduleReason || undefined,
      });
      showToast('success', 'Appointment rescheduled successfully');
      setRescheduleDialogOpen(false);
      fetchAppointments();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedAppointment) return;
    try {
      setCancelLoading(true);
      await clinicalApi.cancelAppointment(selectedAppointment.id, cancelReason || undefined);
      showToast('success', 'Appointment cancelled successfully');
      setCancelDialogOpen(false);
      fetchAppointments();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRefer = async () => {
    if (!selectedAppointment || !referDoctor) return;
    try {
      setReferLoading(true);
      await clinicalApi.referAppointment(selectedAppointment.id, {
        referredTo: referDoctor,
        departmentId: referDepartment || undefined,
        reason: referReason || undefined,
      });
      showToast('success', 'Appointment referred successfully');
      setReferDialogOpen(false);
      fetchAppointments();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to refer appointment');
    } finally {
      setReferLoading(false);
    }
  };

  // -- check-in & complete actions -----------------------------------------------

  const handleCheckIn = async (apt: Appointment) => {
    try {
      setCheckInLoadingId(apt.id);
      await clinicalApi.checkInAppointment(apt.id);
      showToast('success', `${apt.patientName || 'Patient'} checked in successfully`);
      fetchAppointments();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to check in appointment');
    } finally {
      setCheckInLoadingId(null);
    }
  };

  const openCompleteDialog = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setCompleteNotes('');
    setCompleteDecision('discharge');
    setCompleteEncounterType('inpatient');
    setCompleteChiefComplaint('');
    setCompleteAdmissionDiagnosis('');
    setSelectedHospitalId('');
    setSelectedDepartmentId('');
    setSelectedWardId('');
    setSelectedBedId('');
    setDepartments([]);
    setWards([]);
    setAvailableBeds([]);
    setCompleteDialogOpen(true);
    // Fetch hospitals for admission option
    fetchHospitals();
  };

  const fetchHospitals = async () => {
    try {
      setHospitalsLoading(true);
      const response = await hospitalsApi.findAll();
      if (response.success) {
        setHospitals(response.data);
      }
    } catch {
      // Non-critical
    } finally {
      setHospitalsLoading(false);
    }
  };

  const handleHospitalChange = async (hospitalId: string) => {
    setSelectedHospitalId(hospitalId);
    setSelectedDepartmentId('');
    setSelectedWardId('');
    setSelectedBedId('');
    setDepartments([]);
    setWards([]);
    setAvailableBeds([]);
    if (!hospitalId) return;
    try {
      setDepartmentsLoading(true);
      const response = await hospitalsApi.getDepartments(hospitalId);
      if (response.success) {
        setDepartments(response.data);
      }
    } catch {
      // Non-critical
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleDepartmentChange = async (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setSelectedWardId('');
    setSelectedBedId('');
    setWards([]);
    setAvailableBeds([]);
    if (!departmentId || !selectedHospitalId) return;
    try {
      setWardsLoading(true);
      const response = await hospitalsApi.getWards(selectedHospitalId, departmentId);
      if (response.success) {
        setWards(response.data);
      }
    } catch {
      // Non-critical
    } finally {
      setWardsLoading(false);
    }
  };

  const handleWardChange = async (wardId: string) => {
    setSelectedWardId(wardId);
    setSelectedBedId('');
    setAvailableBeds([]);
    if (!wardId) return;
    try {
      setBedsLoading(true);
      const response = await hospitalsApi.getAvailableBeds({ wardId });
      if (response.success) {
        setAvailableBeds(response.data);
      }
    } catch {
      // Non-critical
    } finally {
      setBedsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedAppointment) return;
    try {
      setCompleteLoading(true);
      const payload: Record<string, any> = {
        notes: completeNotes || undefined,
        createEncounter: completeDecision === 'admit',
      };
      if (completeDecision === 'admit') {
        payload.encounterType = completeEncounterType;
        payload.hospitalId = selectedHospitalId || undefined;
        payload.departmentId = selectedDepartmentId || undefined;
        payload.wardId = selectedWardId || undefined;
        payload.bedId = selectedBedId || undefined;
        payload.chiefComplaint = completeChiefComplaint || undefined;
        payload.admissionDiagnosis = completeAdmissionDiagnosis || undefined;
      }
      await clinicalApi.completeAppointment(selectedAppointment.id, payload);
      showToast('success', 'Appointment completed successfully');
      setCompleteDialogOpen(false);
      fetchAppointments();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setCompleteLoading(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setDoctorFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  };

  const hasActiveFilters =
    statusFilter !== 'all' || typeFilter !== 'all' || doctorFilter !== 'all' || dateFrom || dateTo;

  // -- render -----------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] max-w-sm rounded-lg border px-4 py-3 shadow-lg transition-all ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CalendarClock className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage and track patient appointments across departments
          </p>
        </div>
        <Button onClick={() => router.push('/appointments/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CalendarClock className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter((a) => a.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter((a) => a.status === 'cancelled').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filter bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name, CHI number, doctor, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchAppointments()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filters row */}
            {showFilters && (
              <div className="grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
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
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Doctor</Label>
                  <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All doctors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Doctors</SelectItem>
                      {doctors.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          Dr {doc.firstName} {doc.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">From Date</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To Date</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading appointments...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={fetchAppointments}>
                Retry
              </Button>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium text-muted-foreground">No appointments found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters || searchQuery
                  ? 'Try adjusting your filters or search query.'
                  : 'Create a new appointment to get started.'}
              </p>
              {!hasActiveFilters && !searchQuery && (
                <Button
                  className="mt-4 gap-2"
                  onClick={() => router.push('/appointments/new')}
                >
                  <Plus className="h-4 w-4" />
                  New Appointment
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('patientName')}
                  >
                    Patient
                    <SortIcon field="patientName" />
                  </TableHead>
                  <TableHead>CHI Number</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('doctorName')}
                  >
                    Doctor
                    <SortIcon field="doctorName" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('type')}
                  >
                    Type
                    <SortIcon field="type" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('scheduledDate')}
                  >
                    Date / Time
                    <SortIcon field="scheduledDate" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    <SortIcon field="status" />
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((apt) => {
                  const statusInfo = STATUS_BADGE_MAP[apt.status];
                  const isCancellable = !['cancelled', 'completed', 'no_show'].includes(apt.status);
                  return (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">
                        {apt.patientName || 'Unknown Patient'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {apt.patientChiNumber || '-'}
                      </TableCell>
                      <TableCell>{apt.doctorName ? `Dr ${apt.doctorName}` : '-'}</TableCell>
                      <TableCell>{TYPE_LABELS[apt.type] || apt.type}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{formatDate(apt.scheduledDate)}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(apt.scheduledTime)}
                            {apt.duration ? ` (${apt.duration} min)` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="View details"
                            onClick={() => openViewDialog(apt)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 p-0 px-2 text-emerald-600 hover:text-emerald-700 gap-1"
                              title="Check In"
                              disabled={checkInLoadingId === apt.id}
                              onClick={() => handleCheckIn(apt)}
                            >
                              {checkInLoadingId === apt.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              <span className="text-xs">Check In</span>
                            </Button>
                          )}
                          {apt.status === 'in_progress' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 p-0 px-2 text-blue-600 hover:text-blue-700 gap-1"
                              title="Complete"
                              onClick={() => openCompleteDialog(apt)}
                            >
                              <ClipboardCheck className="h-4 w-4" />
                              <span className="text-xs">Complete</span>
                            </Button>
                          )}
                          {isCancellable && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Reschedule"
                                onClick={() => openRescheduleDialog(apt)}
                              >
                                <CalendarClock className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="Cancel"
                                onClick={() => openCancelDialog(apt)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Refer"
                                onClick={() => openReferDialog(apt)}
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ---------- View Details Dialog ---------- */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              Full information for this appointment
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Patient</p>
                  <p className="font-medium">{selectedAppointment.patientName || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CHI Number</p>
                  <p className="font-medium font-mono">
                    {selectedAppointment.patientChiNumber || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Doctor</p>
                  <p className="font-medium">
                    {selectedAppointment.doctorName
                      ? `Dr ${selectedAppointment.doctorName}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{selectedAppointment.departmentName || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {TYPE_LABELS[selectedAppointment.type] || selectedAppointment.type}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={STATUS_BADGE_MAP[selectedAppointment.status].variant}>
                    {STATUS_BADGE_MAP[selectedAppointment.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedAppointment.scheduledDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {formatTime(selectedAppointment.scheduledTime)}
                    {selectedAppointment.duration ? ` (${selectedAppointment.duration} min)` : ''}
                  </p>
                </div>
                {selectedAppointment.autoAssigned && (
                  <div className="col-span-2">
                    <Badge variant="info">Auto-assigned</Badge>
                  </div>
                )}
              </div>
              {selectedAppointment.reason && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Reason</p>
                  <p className="mt-1">{selectedAppointment.reason}</p>
                </div>
              )}
              {selectedAppointment.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Notes</p>
                  <p className="mt-1">{selectedAppointment.notes}</p>
                </div>
              )}
              {selectedAppointment.cancellationReason && (
                <div className="text-sm">
                  <p className="text-muted-foreground text-red-600">Cancellation Reason</p>
                  <p className="mt-1 text-red-600">{selectedAppointment.cancellationReason}</p>
                </div>
              )}
              {selectedAppointment.referredFrom && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Referred From</p>
                  <p className="mt-1">{selectedAppointment.referredFrom}</p>
                </div>
              )}
              {selectedAppointment.referredTo && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Referred To</p>
                  <p className="mt-1">{selectedAppointment.referredTo}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground border-t pt-3">
                Created {formatDate(selectedAppointment.createdAt)}
                {selectedAppointment.updatedAt !== selectedAppointment.createdAt &&
                  ` | Updated ${formatDate(selectedAppointment.updatedAt)}`}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Reschedule Dialog ---------- */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Choose a new date and time for{' '}
              {selectedAppointment?.patientName || 'this patient'}&apos;s appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">New Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-time">New Time</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-reason">Reason (optional)</Label>
              <Textarea
                id="reschedule-reason"
                placeholder="Reason for rescheduling..."
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!rescheduleDate || !rescheduleTime || rescheduleLoading}
            >
              {rescheduleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Cancel Dialog ---------- */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel{' '}
              {selectedAppointment?.patientName || 'this patient'}&apos;s appointment on{' '}
              {selectedAppointment ? formatDate(selectedAppointment.scheduledDate) : ''}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Please provide a reason for cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Appointment
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelLoading}>
              {cancelLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Refer Dialog ---------- */}
      <Dialog open={referDialogOpen} onOpenChange={setReferDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refer Appointment</DialogTitle>
            <DialogDescription>
              Refer {selectedAppointment?.patientName || 'this patient'}&apos;s appointment to
              another doctor or department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target Doctor</Label>
              <Select value={referDoctor} onValueChange={setReferDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors
                    .filter((d) => d.id !== selectedAppointment?.doctorId)
                    .map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        Dr {doc.firstName} {doc.lastName}
                        {doc.department ? ` - ${doc.department}` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refer-department">Department (optional)</Label>
              <Input
                id="refer-department"
                placeholder="Department ID or name"
                value={referDepartment}
                onChange={(e) => setReferDepartment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refer-reason">Reason (optional)</Label>
              <Textarea
                id="refer-reason"
                placeholder="Reason for referral..."
                value={referReason}
                onChange={(e) => setReferReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReferDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRefer} disabled={!referDoctor || referLoading}>
              {referLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Refer Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Complete Appointment Dialog ---------- */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Complete Appointment</DialogTitle>
            <DialogDescription>
              Complete {selectedAppointment?.patientName || 'this patient'}&apos;s appointment and
              choose a discharge or admission pathway.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="complete-notes">Notes</Label>
              <Textarea
                id="complete-notes"
                placeholder="Appointment notes..."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Decision */}
            <div className="space-y-2">
              <Label>Decision</Label>
              <Select
                value={completeDecision}
                onValueChange={(v) => setCompleteDecision(v as 'discharge' | 'admit')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discharge">Outpatient Discharge</SelectItem>
                  <SelectItem value="admit">Admit (Inpatient)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Admission fields (only shown when "Admit" is selected) */}
            {completeDecision === 'admit' && (
              <>
                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Admission Details</p>

                {/* Encounter Type */}
                <div className="space-y-2">
                  <Label>Encounter Type</Label>
                  <Select value={completeEncounterType} onValueChange={setCompleteEncounterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inpatient">Inpatient</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="day_case">Day Case</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Chief Complaint */}
                <div className="space-y-2">
                  <Label htmlFor="complete-chief-complaint">Chief Complaint</Label>
                  <Textarea
                    id="complete-chief-complaint"
                    placeholder="Describe the chief complaint..."
                    value={completeChiefComplaint}
                    onChange={(e) => setCompleteChiefComplaint(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Admission Diagnosis */}
                <div className="space-y-2">
                  <Label htmlFor="complete-admission-diagnosis">Admission Diagnosis</Label>
                  <Textarea
                    id="complete-admission-diagnosis"
                    placeholder="Admission diagnosis..."
                    value={completeAdmissionDiagnosis}
                    onChange={(e) => setCompleteAdmissionDiagnosis(e.target.value)}
                    rows={2}
                  />
                </div>

                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Bed Assignment</p>

                {/* Hospital */}
                <div className="space-y-2">
                  <Label>Hospital</Label>
                  <Select value={selectedHospitalId} onValueChange={handleHospitalChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={hospitalsLoading ? 'Loading...' : 'Select hospital'} />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={selectedDepartmentId}
                    onValueChange={handleDepartmentChange}
                    disabled={!selectedHospitalId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          departmentsLoading
                            ? 'Loading...'
                            : !selectedHospitalId
                              ? 'Select hospital first'
                              : 'Select department'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ward */}
                <div className="space-y-2">
                  <Label>Ward</Label>
                  <Select
                    value={selectedWardId}
                    onValueChange={handleWardChange}
                    disabled={!selectedDepartmentId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          wardsLoading
                            ? 'Loading...'
                            : !selectedDepartmentId
                              ? 'Select department first'
                              : 'Select ward'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.currentOccupancy}/{w.bedCapacity} beds)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Available Bed */}
                <div className="space-y-2">
                  <Label>Available Bed</Label>
                  <Select
                    value={selectedBedId}
                    onValueChange={setSelectedBedId}
                    disabled={!selectedWardId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          bedsLoading
                            ? 'Loading...'
                            : !selectedWardId
                              ? 'Select ward first'
                              : availableBeds.length === 0
                                ? 'No beds available'
                                : 'Select bed'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBeds.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          Bed {b.bedNumber} ({b.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={completeLoading}>
              {completeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
