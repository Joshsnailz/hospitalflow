'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { clinicalApi } from '@/lib/api/clinical';
import { hospitalsApi } from '@/lib/api/hospitals';
import { apiClient } from '@/lib/api/client';
import type { Patient } from '@/lib/types/patient';
import type { Hospital, Department } from '@/lib/types/hospital';
import type { CreateAppointmentDto } from '@/lib/types/clinical';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Search,
  Loader2,
  User,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  Building2,
  Stethoscope,
  FileText,
  X,
  ChevronRight,
} from 'lucide-react';

// -- helpers ------------------------------------------------------------------

function formatDateForDisplay(dateStr: string): string {
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

function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// -- component ----------------------------------------------------------------

export default function WalkInRegistrationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Step tracking
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Patient search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Appointment form
  const [doctor, setDoctor] = useState('');
  const [reason, setReason] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [hospitalsLoading, setHospitalsLoading] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);

  // -- data fetching ----------------------------------------------------------

  // Fetch hospitals on mount
  useEffect(() => {
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
    fetchHospitals();
  }, []);

  // Fetch departments when hospital changes
  useEffect(() => {
    if (!selectedHospital) {
      setDepartments([]);
      setSelectedDepartment('');
      return;
    }
    const fetchDepartments = async () => {
      try {
        const response = await hospitalsApi.getDepartments(selectedHospital);
        if (response.success) {
          setDepartments(response.data);
        }
      } catch {
        setDepartments([]);
      }
    };
    fetchDepartments();
    setSelectedDepartment('');
  }, [selectedHospital]);

  // Patient search with debounce
  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    try {
      setSearchLoading(true);
      setHasSearched(true);
      const response = await apiClient.get('/patients', {
        params: { search: query, limit: 10 },
      });
      if (response.data.success) {
        setSearchResults(response.data.data);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchPatients(value);
    }, 300);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentStep(2);
    setSearchResults([]);
    setSearchQuery('');
    setHasSearched(false);
  };

  const handleChangePatient = () => {
    setSelectedPatient(null);
    setCurrentStep(1);
    setDoctor('');
    setReason('');
    setSelectedHospital('');
    setSelectedDepartment('');
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  // -- submission -------------------------------------------------------------

  const handleRegisterAndCheckIn = async () => {
    if (!selectedPatient) return;

    try {
      setSubmitting(true);

      const today = getTodayDate();
      const now = getCurrentTime();

      const appointmentData: CreateAppointmentDto = {
        patientId: selectedPatient.id,
        type: 'consultation',
        scheduledDate: today,
        scheduledTime: now,
        autoAssign: true,
        reason: reason.trim() || undefined,
      };

      if (selectedHospital) {
        appointmentData.hospitalId = selectedHospital;
      }
      if (selectedDepartment) {
        appointmentData.departmentId = selectedDepartment;
      }

      // Step 1: Create appointment
      const createResponse = await clinicalApi.createAppointment(appointmentData);

      if (!createResponse.success) {
        throw new Error('Failed to create appointment');
      }

      const appointmentId = createResponse.data.id;

      // Step 2: Check in immediately
      await clinicalApi.checkInAppointment(appointmentId);

      showToast(
        'success',
        `Walk-in registered and checked in for ${selectedPatient.firstName} ${selectedPatient.lastName}`
      );

      // Redirect to appointments list after a brief delay
      setTimeout(() => {
        router.push('/appointments');
      }, 1500);
    } catch (err: any) {
      showToast(
        'error',
        err?.response?.data?.message || 'Failed to register walk-in. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

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
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/appointments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Walk-in Registration</h1>
          <p className="text-muted-foreground">
            Quick registration and check-in for walk-in patients
          </p>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            currentStep === 1
              ? 'bg-primary text-primary-foreground'
              : selectedPatient
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {selectedPatient ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-current text-xs">
              1
            </span>
          )}
          Find Patient
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            currentStep === 2
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-current text-xs">
            2
          </span>
          Register &amp; Check In
        </div>
      </div>

      {/* Step 1: Patient Search */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              Find Patient
            </CardTitle>
            <CardDescription>
              Search for the patient by name or CHI number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search by patient name or CHI number..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-11"
                  autoFocus
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Search Results */}
              {searchLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Searching patients...</span>
                </div>
              )}

              {!searchLoading && hasSearched && searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {searchResults.length} patient{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                  <div className="space-y-2">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="font-mono">{patient.chiNumber}</span>
                              <span>
                                DOB: {formatDateForDisplay(patient.dateOfBirth)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSelectPatient(patient)}
                        >
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!searchLoading && hasSearched && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium text-muted-foreground">No patients found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No patients match your search. Please register the patient first.
                  </p>
                  <Link href="/patients?action=create">
                    <Button variant="outline" size="sm" className="mt-4 gap-2">
                      <UserPlus className="h-4 w-4" />
                      Register New Patient
                    </Button>
                  </Link>
                </div>
              )}

              {!hasSearched && !searchLoading && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <User className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Start typing to search for a patient
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Quick Appointment Creation */}
      {currentStep === 2 && selectedPatient && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form - left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Patient Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Selected Patient
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-mono">{selectedPatient.chiNumber}</span>
                        <span>
                          DOB: {formatDateForDisplay(selectedPatient.dateOfBirth)}
                        </span>
                        <Badge variant="outline" className="capitalize text-xs">
                          {selectedPatient.gender}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleChangePatient}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" />
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardCheck className="h-5 w-5" />
                  Appointment Details
                </CardTitle>
                <CardDescription>
                  The following fields are pre-filled for a walk-in consultation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Pre-filled fields shown as read-only info */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Type</p>
                      <p className="font-medium text-sm">Consultation</p>
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Date</p>
                      <p className="font-medium text-sm">{formatDateForDisplay(getTodayDate())}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Time</p>
                      <p className="font-medium text-sm">{getCurrentTime()}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Optional fields */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="doctor" className="flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5" />
                        Preferred Doctor (optional)
                      </Label>
                      <Input
                        id="doctor"
                        placeholder="Enter doctor name..."
                        value={doctor}
                        onChange={(e) => setDoctor(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to auto-assign the best available doctor
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason" className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Reason for Visit (optional)
                      </Label>
                      <Textarea
                        id="reason"
                        placeholder="Brief reason for the walk-in visit..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - right column */}
          <div className="space-y-6">
            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  Location
                </CardTitle>
                <CardDescription>
                  Select hospital and department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hospital</Label>
                    <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={hospitalsLoading ? 'Loading...' : 'Select hospital'}
                        />
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

                  {selectedHospital && (
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              departments.length === 0
                                ? 'No departments available'
                                : 'Select department'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                              {d.specialty ? ` (${d.specialty})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleRegisterAndCheckIn}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ClipboardCheck className="h-4 w-4" />
                    )}
                    {submitting ? 'Registering...' : 'Register & Check In'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/appointments')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Summary */}
                <div className="mt-4 rounded-lg border bg-muted/50 p-3 space-y-2 text-sm">
                  <p className="font-medium text-xs uppercase text-muted-foreground">
                    Walk-in Summary
                  </p>
                  <div className="space-y-1">
                    <p>
                      <span className="text-muted-foreground">Patient:</span>{' '}
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </p>
                    <p>
                      <span className="text-muted-foreground">CHI:</span>{' '}
                      <span className="font-mono">{selectedPatient.chiNumber}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Type:</span> Consultation
                    </p>
                    <p>
                      <span className="text-muted-foreground">Date:</span>{' '}
                      {formatDateForDisplay(getTodayDate())}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Time:</span> {getCurrentTime()}
                    </p>
                    {selectedHospital && (
                      <p>
                        <span className="text-muted-foreground">Hospital:</span>{' '}
                        {hospitals.find((h) => h.id === selectedHospital)?.name || '-'}
                      </p>
                    )}
                    {selectedDepartment && (
                      <p>
                        <span className="text-muted-foreground">Department:</span>{' '}
                        {departments.find((d) => d.id === selectedDepartment)?.name || '-'}
                      </p>
                    )}
                    <Badge variant="info" className="mt-1">
                      Auto-assign enabled
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
