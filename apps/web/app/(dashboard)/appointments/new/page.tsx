'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { isAdmin } from '@/lib/permissions';
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
  { value: 'imaging', label: 'Imaging' },
  { value: 'imaging_review', label: 'Imaging Review' },
  { value: 'referral', label: 'Referral' },
  { value: 'check_up', label: 'Check-up' },
  { value: 'nursing_assessment', label: 'Nursing Assessment' },
];

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

// -- component ----------------------------------------------------------------

export default function NewAppointmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const patientSearchRef = useRef<HTMLInputElement>(null);

  // Role guard: only admins can create scheduled appointments
  useEffect(() => {
    if (user && !isAdmin(user.role)) {
      router.replace('/appointments');
    }
  }, [user, router]);

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
  const [hasPatientSearched, setHasPatientSearched] = useState(false);

  // Doctors
  const [doctors, setDoctors] = useState<User[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

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
    const fetchDoctors = async () => {
      try {
        setDoctorsLoading(true);
        // Fetch all clinical roles that can be assigned appointments
        const response = await usersApi.findAll({ role: 'doctor,consultant,prescriber', limit: 500 });
        if (response.success) {
          setDoctors(response.data);
        }
      } catch {
        // Non-critical
      } finally {
        setDoctorsLoading(false);
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

    fetchDoctors();
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
  }, [selectedHospital]);

  // Patient search - only triggered on button click or Enter
  const handlePatientSearch = async () => {
    if (patientSearch.length < 2) return;
    try {
      setPatientSearchLoading(true);
      setHasPatientSearched(true);
      const response = await patientsApi.findAll({ search: patientSearch, limit: 10 });
      if (response.success) {
        setPatientResults(response.data);
      }
    } catch {
      setPatientResults([]);
    } finally {
      setPatientSearchLoading(false);
    }
  };

  const handlePatientSearchChange = (value: string) => {
    setPatientSearch(value);
    if (selectedPatient) {
      setSelectedPatient(null);
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch('');
    setPatientResults([]);
    setHasPatientSearched(false);
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
    setHasPatientSearched(false);
    patientSearchRef.current?.focus();
  };

  // -- validation & submission ------------------------------------------------

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const today = new Date().toISOString().split('T')[0];

    if (!selectedPatient) {
      errors.patient = 'Please select a patient';
    }
    if (!appointmentType) {
      errors.type = 'Please select an appointment type';
    }
    if (!scheduledDate) {
      errors.date = 'Please select a date';
    } else if (scheduledDate < today) {
      errors.date = 'Appointment date cannot be in the past';
    }
    if (!scheduledTime) {
      errors.time = 'Please select a time';
    } else if (scheduledTime < '07:00' || scheduledTime > '20:00') {
      errors.time = 'Appointment time must be between 07:00 and 20:00';
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

      const selectedDoc = doctors.find((d) => d.id === selectedDoctor);
      const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00.000Z`;

      const payload: Record<string, any> = {
        patientId: selectedPatient!.id,
        patientChi: selectedPatient!.chiNumber || '',
        patientName: `${selectedPatient!.firstName} ${selectedPatient!.lastName}`,
        appointmentType: appointmentType,
        scheduledDate: scheduledDateTime,
        durationMinutes: parseInt(duration, 10),
        autoAssign,
      };

      if (!autoAssign && selectedDoctor) {
        payload.doctorId = selectedDoctor;
        if (selectedDoc) {
          payload.doctorName = `Dr ${selectedDoc.firstName} ${selectedDoc.lastName}`;
        }
      }
      if (selectedHospital) payload.hospitalId = selectedHospital;
      if (selectedDepartment) payload.departmentId = selectedDepartment;
      if (reason.trim()) payload.reason = reason.trim();
      if (notes.trim()) payload.notes = notes.trim();

      await clinicalApi.createAppointment(payload as any);
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
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            ref={patientSearchRef}
                            placeholder="Type patient name or CHI number..."
                            value={patientSearch}
                            onChange={(e) => handlePatientSearchChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handlePatientSearch();
                            }}
                            className="pl-9"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handlePatientSearch}
                          disabled={patientSearch.length < 2 || patientSearchLoading}
                        >
                          {patientSearchLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                          <span className="ml-1">Search</span>
                        </Button>
                      </div>
                      {patientResults.length > 0 && (
                        <div className="space-y-2">
                          {patientResults.map((patient) => (
                            <div
                              key={patient.id}
                              className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
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
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize text-xs">
                                  {patient.gender}
                                </Badge>
                                <Button type="button" size="sm" onClick={() => selectPatient(patient)}>
                                  Select
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {!patientSearchLoading && hasPatientSearched && patientResults.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-3">
                          No patients found for &quot;{patientSearch}&quot;
                        </p>
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
                      min={new Date().toISOString().split('T')[0]}
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
                      min="07:00"
                      max="20:00"
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
                  <div className="flex items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                    <div>
                      <p className="text-sm font-semibold">Auto-assign Doctor</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Uses round-robin load balancing to distribute among available clinicians
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
                      <Label>Select Doctor *</Label>
                      <Select
                        value={selectedDoctor}
                        onValueChange={(val) => {
                          setSelectedDoctor(val);
                          setValidationErrors((prev) => {
                            const next = { ...prev };
                            delete next.doctor;
                            return next;
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={doctorsLoading ? 'Loading...' : 'Select a doctor'} />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              Dr {doc.firstName} {doc.lastName}
                              {doc.role && doc.role !== 'doctor'
                                ? ` (${doc.role.charAt(0).toUpperCase() + doc.role.slice(1)})`
                                : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.doctor && (
                        <p className="text-sm text-red-600">{validationErrors.doctor}</p>
                      )}
                    </div>
                  )}

                  {autoAssign && (
                    <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                      The system will automatically assign the most suitable available doctor based
                      on the appointment type, date, and department.
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
