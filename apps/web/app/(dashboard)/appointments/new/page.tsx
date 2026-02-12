'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { appointmentsApi } from '@/lib/api/appointments';
import { usersApi } from '@/lib/api/users';
import type { Clinician } from '@/lib/api/users';
import { hospitalsApi } from '@/lib/api/hospitals';
import type { CreateAppointmentDto, AppointmentType } from '@/lib/types/appointment';
import type { Patient } from '@/lib/types/patient';
import type { Hospital, Department } from '@/lib/types/hospital';
import { canCreateAppointments } from '@/lib/permissions';
import { APPOINTMENT_TYPES, DURATION_OPTIONS } from '@/lib/constants/appointments';
import { formatRoleName } from '@/lib/utils/date-format';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/appointments';
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
  Loader2,
  CalendarPlus,
  User as UserIcon,
  Stethoscope,
  Building2,
  Clock,
  FileText,
} from 'lucide-react';
import { PatientSearchInput } from '@/components/shared/patient-search-input';

export default function NewAppointmentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast, showToast } = useToast(5000);

  // Admin guard
  useEffect(() => {
    if (!authLoading && user && !canCreateAppointments(user.role)) {
      router.replace('/appointments');
    }
  }, [authLoading, user, router]);

  // Patient
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Clinicians
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [cliniciansLoading, setCliniciansLoading] = useState(false);

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

  useEffect(() => {
    const fetchClinicians = async () => {
      try {
        setCliniciansLoading(true);
        const response = await usersApi.getClinicians();
        if (response.success) setClinicians(response.data);
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
        if (response.success) setHospitals(response.data);
      } catch {
        // Non-critical
      } finally {
        setHospitalsLoading(false);
      }
    };

    fetchClinicians();
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (!selectedHospital) {
      setDepartments([]);
      setSelectedDepartment('');
      return;
    }
    hospitalsApi.getDepartments(selectedHospital).then((res) => {
      if (res.success) setDepartments(res.data);
    }).catch(() => setDepartments([]));
  }, [selectedHospital]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!selectedPatientId || !selectedPatient) errors.patient = 'Please select a patient';
    if (!appointmentType) errors.type = 'Please select an appointment type';
    if (!scheduledDate) errors.date = 'Please select a date';
    if (!scheduledTime) errors.time = 'Please select a time';
    if (!autoAssign && !selectedDoctor) errors.doctor = 'Please select a doctor or enable auto-assign';
    if (!selectedHospital || selectedHospital === 'none') errors.hospital = 'Please select a hospital';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const isoScheduledDate = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      const dto: CreateAppointmentDto = {
        scenario: 'scheduled',
        patientId: selectedPatientId,
        patientChi: selectedPatient!.chiNumber,
        patientName: `${selectedPatient!.firstName} ${selectedPatient!.lastName}`,
        hospitalId: selectedHospital,
        appointmentType: appointmentType as AppointmentType,
        scheduledDate: isoScheduledDate,
        durationMinutes: parseInt(duration, 10),
        autoAssign,
      };

      if (!autoAssign && selectedDoctor) {
        dto.doctorId = selectedDoctor;
        const doc = clinicians.find((d) => d.id === selectedDoctor);
        if (doc) dto.doctorName = `${doc.firstName} ${doc.lastName} - ${formatRoleName(doc.role)}`;
      }
      if (selectedDepartment && selectedDepartment !== 'none') dto.departmentId = selectedDepartment;
      if (reason.trim()) dto.reason = reason.trim();
      if (notes.trim()) dto.notes = notes.trim();

      await appointmentsApi.createAppointment(dto);
      showToast('success', 'Appointment created successfully');
      setTimeout(() => router.push('/appointments'), 1200);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to create appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = (field: string) => {
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <ToastContainer toast={toast} />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/appointments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Appointment</h1>
          <p className="text-muted-foreground">Schedule a new patient appointment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserIcon className="h-5 w-5" />
                  Patient
                </CardTitle>
                <CardDescription>Search for a patient by name or CHI number</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <PatientSearchInput
                    value={selectedPatientId}
                    onValueChange={(id) => {
                      setSelectedPatientId(id);
                      if (!id) setSelectedPatient(null);
                      clearError('patient');
                    }}
                    onPatientSelect={(patient) => setSelectedPatient(patient)}
                  />
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
                <CardDescription>Set the type, date, and time for the appointment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Appointment Type *</Label>
                    <Select
                      value={appointmentType}
                      onValueChange={(val) => {
                        setAppointmentType(val as AppointmentType);
                        clearError('type');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPOINTMENT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.type && <p className="text-sm text-red-600">{validationErrors.type}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((d) => (
                          <SelectItem key={d} value={String(d)}>{d} minutes</SelectItem>
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
                      onChange={(e) => { setScheduledDate(e.target.value); clearError('date'); }}
                    />
                    {validationErrors.date && <p className="text-sm text-red-600">{validationErrors.date}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => { setScheduledTime(e.target.value); clearError('time'); }}
                    />
                    {validationErrors.time && <p className="text-sm text-red-600">{validationErrors.time}</p>}
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
                    <Textarea id="reason" placeholder="Brief reason for this appointment..." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea id="notes" placeholder="Any additional notes or instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Doctor Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5" />
                  Doctor
                </CardTitle>
                <CardDescription>Select a doctor or enable auto-assign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Auto-assign Doctor</p>
                      <p className="text-xs text-muted-foreground">System will assign the best available doctor</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoAssign}
                      onClick={() => {
                        setAutoAssign(!autoAssign);
                        if (!autoAssign) { setSelectedDoctor(''); clearError('doctor'); }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${autoAssign ? 'bg-primary' : 'bg-input'}`}
                    >
                      <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${autoAssign ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {!autoAssign && (
                    <div className="space-y-2">
                      <Label>Select Clinician *</Label>
                      <Select value={selectedDoctor} onValueChange={(val) => { setSelectedDoctor(val); clearError('doctor'); }}>
                        <SelectTrigger>
                          <SelectValue placeholder={cliniciansLoading ? 'Loading...' : 'Select a clinician'} />
                        </SelectTrigger>
                        <SelectContent>
                          {clinicians.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.firstName} {doc.lastName} - {formatRoleName(doc.role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.doctor && <p className="text-sm text-red-600">{validationErrors.doctor}</p>}
                    </div>
                  )}

                  {autoAssign && (
                    <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                      The system will automatically assign the most suitable available doctor based on the appointment type, date, and department.
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
                <CardDescription>Select hospital and department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hospital *</Label>
                    <Select value={selectedHospital} onValueChange={(val) => { setSelectedHospital(val); clearError('hospital'); }}>
                      <SelectTrigger>
                        <SelectValue placeholder={hospitalsLoading ? 'Loading...' : 'Select a hospital'} />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitals.map((h) => (
                          <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.hospital && <p className="text-sm text-red-600">{validationErrors.hospital}</p>}
                  </div>

                  {selectedHospital && selectedHospital !== 'none' && (
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                          <SelectValue placeholder={departments.length === 0 ? 'No departments available' : 'Select a department'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific department</SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}{d.specialty ? ` (${d.specialty})` : ''}
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
                  <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                    {submitting ? 'Creating Appointment...' : 'Create Appointment'}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => router.push('/appointments')} disabled={submitting}>
                    Cancel
                  </Button>
                </div>

                {selectedPatient && appointmentType && scheduledDate && (
                  <div className="mt-4 rounded-lg border bg-muted/50 p-3 space-y-2 text-sm">
                    <p className="font-medium text-xs uppercase text-muted-foreground">Appointment Summary</p>
                    <div className="space-y-1">
                      <p><span className="text-muted-foreground">Patient:</span> {selectedPatient.firstName} {selectedPatient.lastName}</p>
                      <p><span className="text-muted-foreground">Type:</span> {APPOINTMENT_TYPES.find((t) => t.value === appointmentType)?.label}</p>
                      <p><span className="text-muted-foreground">Date:</span> {new Date(scheduledDate).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      {scheduledTime && <p><span className="text-muted-foreground">Time:</span> {scheduledTime}</p>}
                      <p><span className="text-muted-foreground">Duration:</span> {duration} min</p>
                      {autoAssign ? (
                        <Badge variant="info" className="mt-1">Auto-assign enabled</Badge>
                      ) : selectedDoctor ? (
                        <p>
                          <span className="text-muted-foreground">Clinician:</span>{' '}
                          {(() => {
                            const doc = clinicians.find((d) => d.id === selectedDoctor);
                            return doc ? `${doc.firstName} ${doc.lastName} - ${formatRoleName(doc.role)}` : '-';
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
