'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { clinicalApi } from '@/lib/api/clinical';
import { patientsApi } from '@/lib/api/patients';
import { usersApi } from '@/lib/api/users';
import { hospitalsApi } from '@/lib/api/hospitals';
import type { CreateAppointmentDto, AppointmentType } from '@/lib/types/clinical';
import type { Patient } from '@/lib/types/patient';
import type { User } from '@/lib/types/user';
import type { Hospital, Department } from '@/lib/types/hospital';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  CalendarPlus,
  User as UserIcon,
  Stethoscope,
  Building2,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

// -- constants ----------------------------------------------------------------

const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'lab_review', label: 'Lab Review' },
  { value: 'imaging_review', label: 'Imaging Review' },
  { value: 'referral', label: 'Referral' },
  { value: 'check_up', label: 'Check-up' },
];

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

// -- component ----------------------------------------------------------------

export default function NewAppointmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const patientSearchRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Doctors/Clinicians
  const [clinicians, setClinicians] = useState<User[]>([]);
  const [cliniciansLoading, setCliniciansLoading] = useState(false);
  const [clinicianSearch, setClinicianSearch] = useState('');
  const [clinicianResults, setClinicianResults] = useState<User[]>([]);
  const [selectedClinician, setSelectedClinician] = useState<User | null>(null);
  const [showClinicianDropdown, setShowClinicianDropdown] = useState(false);

  // Hospitals & departments
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);

  // Form fields
  const [appointmentType, setAppointmentType] = useState<AppointmentType | ''>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [autoAssign, setAutoAssign] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // -- data fetching ----------------------------------------------------------

  useEffect(() => {
    const fetchClinicians = async () => {
      try {
        setCliniciansLoading(true);
        // Fetch all clinicians: doctors, consultants, nurses, etc.
        const response = await usersApi.findAll({
          role: 'doctor,consultant,nurse,hospital_pharmacist,prescriber',
          limit: 200
        });
        if (response.success) {
          setClinicians(response.data);
          setClinicianResults(response.data); // Initialize with all clinicians
        }
      } catch {
        // Non-critical
      } finally {
        setCliniciansLoading(false);
      }
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

    fetchClinicians();
    fetchHospitals();
  }, []);

  // Handle clinician search
  const handleClinicianSearchChange = useCallback((value: string) => {
    setClinicianSearch(value);
    if (value.trim().length === 0) {
      setClinicianResults(clinicians);
      setShowClinicianDropdown(false);
      return;
    }
    const searchLower = value.toLowerCase();
    const filtered = clinicians.filter((c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower) ||
      c.role.toLowerCase().includes(searchLower)
    );
    setClinicianResults(filtered);
    setShowClinicianDropdown(true);
  }, [clinicians]);

  const selectClinician = useCallback((clinician: User) => {
    setSelectedClinician(clinician);
    setSelectedDoctor(clinician.id);
    setClinicianSearch(`${clinician.firstName} ${clinician.lastName}`);
    setShowClinicianDropdown(false);
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next.doctor;
      return next;
    });
  }, []);

  const clearClinician = useCallback(() => {
    setSelectedClinician(null);
    setSelectedDoctor('');
    setClinicianSearch('');
    setClinicianResults(clinicians);
  }, [clinicians]);

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
  }, [selectedHospital]);

  // Patient search with debounce
  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPatientResults([]);
      setShowPatientDropdown(false);
      return;
    }
    try {
      setPatientSearchLoading(true);
      const response = await patientsApi.findAll({ search: query, limit: 10 });
      if (response.success) {
        setPatientResults(response.data);
        setShowPatientDropdown(true);
      }
    } catch {
      setPatientResults([]);
    } finally {
      setPatientSearchLoading(false);
    }
  }, []);

  const handlePatientSearchChange = (value: string) => {
    setPatientSearch(value);
    if (selectedPatient) {
      setSelectedPatient(null);
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchPatients(value);
    }, 300);
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.firstName} ${patient.lastName} (${patient.chiNumber})`);
    setShowPatientDropdown(false);
    setPatientResults([]);
    // Clear any patient validation error
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next.patient;
      return next;
    });
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientResults([]);
    setShowPatientDropdown(false);
    patientSearchRef.current?.focus();
  };

  // -- validation & submission ------------------------------------------------

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedPatient) {
      errors.patient = 'Please select a patient';
    }
    if (!appointmentType) {
      errors.type = 'Please select an appointment type';
    }
    if (!scheduledDate) {
      errors.date = 'Please select a date';
    }
    if (!scheduledTime) {
      errors.time = 'Please select a time';
    }
    if (!autoAssign && !selectedDoctor) {
      errors.doctor = 'Please select a doctor or enable auto-assign';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      const dto: CreateAppointmentDto = {
        patientId: selectedPatient!.id,
        type: appointmentType as AppointmentType,
        scheduledDate,
        scheduledTime,
        duration: parseInt(duration, 10),
        autoAssign,
      };

      if (!autoAssign && selectedDoctor) {
        dto.doctorId = selectedDoctor;
      }
      if (selectedHospital) {
        dto.hospitalId = selectedHospital;
      }
      if (selectedDepartment) {
        dto.departmentId = selectedDepartment;
      }
      if (reason.trim()) {
        dto.reason = reason.trim();
      }
      if (notes.trim()) {
        dto.notes = notes.trim();
      }

      await clinicalApi.createAppointment(dto);
      showToast('success', 'Appointment created successfully');

      // Short delay so user sees the success message, then redirect
      setTimeout(() => {
        router.push('/appointments');
      }, 1200);
    } catch (err: any) {
      showToast(
        'error',
        err?.response?.data?.message || 'Failed to create appointment. Please try again.'
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
          <h1 className="text-3xl font-bold tracking-tight">New Appointment</h1>
          <p className="text-muted-foreground">
            Schedule a new patient appointment
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form - left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserIcon className="h-5 w-5" />
                  Patient
                </CardTitle>
                <CardDescription>
                  Search for a patient by name or CHI number
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedPatient ? (
                    <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                      <div>
                        <p className="font-medium">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="font-mono">{selectedPatient.chiNumber}</span>
                          <span>
                            DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString('en-GB')}
                          </span>
                          <span className="capitalize">{selectedPatient.gender}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearPatient}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        ref={patientSearchRef}
                        placeholder="Type patient name or CHI number to search..."
                        value={patientSearch}
                        onChange={(e) => handlePatientSearchChange(e.target.value)}
                        onFocus={() => {
                          if (patientResults.length > 0) setShowPatientDropdown(true);
                        }}
                        onBlur={() => {
                          // Delay to allow click on dropdown item
                          setTimeout(() => setShowPatientDropdown(false), 200);
                        }}
                        className="pl-9"
                      />
                      {patientSearchLoading && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}

                      {/* Dropdown results */}
                      {showPatientDropdown && patientResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                          <div className="max-h-60 overflow-auto py-1">
                            {patientResults.map((patient) => (
                              <button
                                key={patient.id}
                                type="button"
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectPatient(patient);
                                }}
                              >
                                <div>
                                  <p className="font-medium">
                                    {patient.firstName} {patient.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    CHI: {patient.chiNumber} | DOB:{' '}
                                    {new Date(patient.dateOfBirth).toLocaleDateString('en-GB')}
                                  </p>
                                </div>
                                <Badge variant="outline" className="ml-2 capitalize text-xs">
                                  {patient.gender}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {showPatientDropdown &&
                        !patientSearchLoading &&
                        patientSearch.length >= 2 &&
                        patientResults.length === 0 && (
                          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 shadow-lg">
                            <p className="text-sm text-muted-foreground text-center">
                              No patients found for &quot;{patientSearch}&quot;
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                  {validationErrors.patient && (
                    <p className="text-sm text-red-600">{validationErrors.patient}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Appointment Details
                </CardTitle>
                <CardDescription>
                  Set the type, date, and time for the appointment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Appointment Type *</Label>
                    <Select
                      value={appointmentType}
                      onValueChange={(val) => {
                        setAppointmentType(val as AppointmentType);
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.type;
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPOINTMENT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.type && (
                      <p className="text-sm text-red-600">{validationErrors.type}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {d} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => {
                        setScheduledDate(e.target.value);
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.date;
                          return next;
                        });
                      }}
                    />
                    {validationErrors.date && (
                      <p className="text-sm text-red-600">{validationErrors.date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => {
                        setScheduledTime(e.target.value);
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.time;
                          return next;
                        });
                      }}
                    />
                    {validationErrors.time && (
                      <p className="text-sm text-red-600">{validationErrors.time}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reason & Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Reason &amp; Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Appointment</Label>
                    <Textarea
                      id="reason"
                      placeholder="Brief reason for this appointment..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes or instructions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - right column */}
          <div className="space-y-6">
            {/* Doctor Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5" />
                  Doctor
                </CardTitle>
                <CardDescription>
                  Select a doctor or enable auto-assign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Auto-assign toggle */}
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Auto-assign Doctor</p>
                      <p className="text-xs text-muted-foreground">
                        System will assign the best available doctor
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoAssign}
                      onClick={() => {
                        setAutoAssign(!autoAssign);
                        if (!autoAssign) {
                          setSelectedDoctor('');
                          setValidationErrors((prev) => {
                            const next = { ...prev };
                            delete next.doctor;
                            return next;
                          });
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        autoAssign ? 'bg-primary' : 'bg-input'
                      }`}
                    >
                      <span
                        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                          autoAssign ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {!autoAssign && (
                    <div className="space-y-2">
                      <Label>Select Clinician *</Label>
                      {selectedClinician ? (
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">
                                {selectedClinician.firstName} {selectedClinician.lastName}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="capitalize text-xs">
                                  {selectedClinician.role.replace(/_/g, ' ')}
                                </Badge>
                                <span>{selectedClinician.email}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearClinician}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Type clinician name to search..."
                            value={clinicianSearch}
                            onChange={(e) => handleClinicianSearchChange(e.target.value)}
                            onFocus={() => {
                              if (clinicianResults.length > 0) setShowClinicianDropdown(true);
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowClinicianDropdown(false), 200);
                            }}
                            className="pl-9"
                          />
                          {cliniciansLoading && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                          )}

                          {/* Dropdown results */}
                          {showClinicianDropdown && clinicianResults.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                              <div className="max-h-60 overflow-auto py-1">
                                {clinicianResults.map((clinician) => (
                                  <button
                                    key={clinician.id}
                                    type="button"
                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      selectClinician(clinician);
                                    }}
                                  >
                                    <div>
                                      <p className="font-medium">
                                        {clinician.firstName} {clinician.lastName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {clinician.email}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="ml-2 capitalize text-xs">
                                      {clinician.role.replace(/_/g, ' ')}
                                    </Badge>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {showClinicianDropdown &&
                            !cliniciansLoading &&
                            clinicianSearch.length >= 1 &&
                            clinicianResults.length === 0 && (
                              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 shadow-lg">
                                <p className="text-sm text-muted-foreground text-center">
                                  No clinicians found for &quot;{clinicianSearch}&quot;
                                </p>
                              </div>
                            )}
                        </div>
                      )}
                      {validationErrors.doctor && (
                        <p className="text-sm text-red-600">{validationErrors.doctor}</p>
                      )}
                    </div>
                  )}

                  {autoAssign && (
                    <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                      The system will automatically assign the most suitable available clinician based
                      on the appointment type, date, department, and current workload.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hospital & Department */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  Location
                </CardTitle>
                <CardDescription>
                  Select hospital and department (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hospital</Label>
                    <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={hospitalsLoading ? 'Loading...' : 'Select a hospital'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific hospital</SelectItem>
                        {hospitals.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedHospital && selectedHospital !== 'none' && (
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              departments.length === 0
                                ? 'No departments available'
                                : 'Select a department'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific department</SelectItem>
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
                    type="submit"
                    className="w-full gap-2"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarPlus className="h-4 w-4" />
                    )}
                    {submitting ? 'Creating Appointment...' : 'Create Appointment'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/appointments')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Summary preview */}
                {selectedPatient && appointmentType && scheduledDate && (
                  <div className="mt-4 rounded-lg border bg-muted/50 p-3 space-y-2 text-sm">
                    <p className="font-medium text-xs uppercase text-muted-foreground">
                      Appointment Summary
                    </p>
                    <div className="space-y-1">
                      <p>
                        <span className="text-muted-foreground">Patient:</span>{' '}
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Type:</span>{' '}
                        {APPOINTMENT_TYPES.find((t) => t.value === appointmentType)?.label}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Date:</span>{' '}
                        {new Date(scheduledDate).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      {scheduledTime && (
                        <p>
                          <span className="text-muted-foreground">Time:</span> {scheduledTime}
                        </p>
                      )}
                      <p>
                        <span className="text-muted-foreground">Duration:</span> {duration} min
                      </p>
                      {autoAssign ? (
                        <Badge variant="info" className="mt-1">
                          Auto-assign enabled
                        </Badge>
                      ) : selectedDoctor ? (
                        <p>
                          <span className="text-muted-foreground">Doctor:</span>{' '}
                          {(() => {
                            const doc = doctors.find((d) => d.id === selectedDoctor);
                            return doc ? `Dr ${doc.firstName} ${doc.lastName}` : '-';
                          })()}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
