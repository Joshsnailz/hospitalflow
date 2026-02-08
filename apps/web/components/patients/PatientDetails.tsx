'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { patientsApi } from '@/lib/api/patients';
import { clinicalApi } from '@/lib/api/clinical';
import type { Patient } from '@/lib/types/patient';
import type { Encounter, Appointment, DischargeForm, EmergencyVisit } from '@/lib/types/clinical';
import {
  Loader2,
  Edit,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Stethoscope,
  Users,
  AlertTriangle,
  FileText,
  CreditCard,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  CalendarDays,
  ClipboardList,
  Activity,
  Ambulance,
  ChevronDown,
  ChevronUp,
  Clock,
  BedDouble,
  GitCommitHorizontal,
  Pill,
  Scissors,
} from 'lucide-react';
import { NextOfKinSection } from './sections/NextOfKinSection';
import { AllergiesSection } from './sections/AllergiesSection';
import { MedicalHistorySection } from './sections/MedicalHistorySection';
import { MedicalAidSection } from './sections/MedicalAidSection';

interface PatientDetailsProps {
  patientId: string;
}

export function PatientDetails({ patientId }: PatientDetailsProps) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Track counts for quick info cards (updated by child components)
  const [allergiesCount, setAllergiesCount] = useState(0);
  const [medicalAidCount, setMedicalAidCount] = useState(0);
  const [nextOfKinCount, setNextOfKinCount] = useState(0);
  const [medicalHistoryCount, setMedicalHistoryCount] = useState(0);

  // Clinical data
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dischargeForms, setDischargeForms] = useState<DischargeForm[]>([]);
  const [emergencyVisits, setEmergencyVisits] = useState<EmergencyVisit[]>([]);

  // Expandable discharge cards
  const [expandedDischargeId, setExpandedDischargeId] = useState<string | null>(null);

  useEffect(() => {
    fetchPatient();
    fetchClinicalData();
  }, [patientId]);

  const fetchClinicalData = async () => {
    try {
      const [enc, apt, dis, emg] = await Promise.allSettled([
        clinicalApi.getEncounters({ patientId }),
        clinicalApi.getPatientAppointments(patientId),
        clinicalApi.getPatientDischargeForms(patientId),
        clinicalApi.getEmergencyVisitsByPatient(patientId),
      ]);
      if (enc.status === 'fulfilled') setEncounters(enc.value.data || []);
      if (apt.status === 'fulfilled') setAppointments(apt.value.data || []);
      if (dis.status === 'fulfilled') setDischargeForms(dis.value.data || []);
      if (emg.status === 'fulfilled') setEmergencyVisits(emg.value.data || []);
    } catch {
      // Clinical data is supplementary - don't block main patient view
    }
  };

  const fetchPatient = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await patientsApi.findOne(patientId);
      setPatient(response.data);
      // Initialize counts from loaded data
      setAllergiesCount(response.data.allergies?.length || 0);
      setMedicalAidCount(response.data.medicalAid?.length || 0);
      setNextOfKinCount(response.data.nextOfKin?.length || 0);
      setMedicalHistoryCount(response.data.medicalHistory?.length || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load patient');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!patient) return;
    setStatusLoading(true);
    setStatusMessage('');
    try {
      if (patient.isActive) {
        await patientsApi.deactivate(patient.id);
        setStatusMessage('Patient deactivated successfully');
      } else {
        await patientsApi.reactivate(patient.id);
        setStatusMessage('Patient reactivated successfully');
      }
      fetchPatient();
    } catch (err: any) {
      setStatusMessage(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // --- Patient Location Banner Logic ---
  const locationBanner = useMemo(() => {
    // Check active encounters (admitted or in_treatment)
    const activeEncounter = encounters.find(
      (e) => e.status === 'admitted' || e.status === 'in_treatment'
    );
    if (activeEncounter) {
      return {
        variant: 'blue' as const,
        icon: <BedDouble className="h-4 w-4" />,
        text: `Currently Admitted \u2014 ${(activeEncounter.encounterType || activeEncounter.type || '').replace(/_/g, ' ')} \u2014 Ward ${activeEncounter.wardId || 'Unassigned'}`,
      };
    }

    // Check awaiting discharge
    const awaitingDischarge = encounters.find(
      (e) => e.status === 'awaiting_discharge'
    );
    if (awaitingDischarge) {
      return {
        variant: 'amber' as const,
        icon: <Clock className="h-4 w-4" />,
        text: 'Awaiting Discharge',
      };
    }

    // Check active emergency visits (triaged or in_treatment)
    const activeEmergency = emergencyVisits.find(
      (e) => e.status === 'triaged' || e.status === 'in_treatment' || e.status === 'observation'
    );
    if (activeEmergency) {
      return {
        variant: 'red' as const,
        icon: <Ambulance className="h-4 w-4" />,
        text: `Emergency Department \u2014 ${activeEmergency.status.replace('_', ' ')}`,
      };
    }

    return null;
  }, [encounters, emergencyVisits]);

  // --- Journey Timeline Logic ---
  type JourneyEvent = {
    id: string;
    date: string;
    type: 'appointment' | 'encounter' | 'emergency' | 'discharge';
    label: string;
    status: string;
    summary: string;
    clinician?: string;
    icon: React.ReactNode;
    linkTo?: string;
  };

  const journeyTimeline = useMemo<JourneyEvent[]>(() => {
    const events: JourneyEvent[] = [];

    appointments.forEach((apt) => {
      events.push({
        id: `apt-${apt.id}`,
        date: apt.scheduledDate,
        type: 'appointment',
        label: 'Appointment',
        status: apt.status,
        summary: apt.reason || `${(apt.appointmentType || apt.type || '').replace(/_/g, ' ')} appointment`,
        clinician: apt.doctorName ? `Dr. ${apt.doctorName}` : undefined,
        icon: <CalendarDays className="h-4 w-4" />,
        linkTo: `/appointments?patientId=${patientId}`,
      });
    });

    encounters.forEach((enc) => {
      events.push({
        id: `enc-${enc.id}`,
        date: enc.admissionDate,
        type: 'encounter',
        label: 'Encounter',
        status: enc.status,
        summary: enc.chiefComplaint || enc.admissionDiagnosis || enc.dischargeDiagnosis || `${(enc.encounterType || enc.type || '').replace(/_/g, ' ')} encounter`,
        clinician: enc.doctorName ? `Dr. ${enc.doctorName}` : undefined,
        icon: <Stethoscope className="h-4 w-4" />,
        linkTo: '/ward',
      });
    });

    emergencyVisits.forEach((ev) => {
      events.push({
        id: `emg-${ev.id}`,
        date: ev.arrivalTime,
        type: 'emergency',
        label: 'Emergency Visit',
        status: ev.status,
        summary: ev.chiefComplaint,
        clinician: ev.attendingDoctorName ? `Dr. ${ev.attendingDoctorName}` : undefined,
        icon: <Ambulance className="h-4 w-4" />,
        linkTo: '/clinical/emergency',
      });
    });

    dischargeForms.forEach((df) => {
      events.push({
        id: `dis-${df.id}`,
        date: df.dischargeDate || df.admissionDate,
        type: 'discharge',
        label: 'Discharge',
        status: df.status,
        summary: df.primaryDiagnosis || 'Discharge form',
        clinician: undefined,
        icon: <FileText className="h-4 w-4" />,
        linkTo: `/discharge/${df.id}`,
      });
    });

    // Sort by date descending (most recent first)
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events;
  }, [appointments, encounters, emergencyVisits, dischargeForms]);

  // --- Journey status badge variant helper ---
  const getJourneyStatusVariant = (type: JourneyEvent['type'], status: string) => {
    const activeStatuses = ['admitted', 'in_treatment', 'in_progress', 'triaged', 'observation', 'active', 'confirmed', 'scheduled'];
    const completedStatuses = ['completed', 'discharged'];
    const warningStatuses = ['awaiting_discharge', 'pending_review', 'no_show'];
    const dangerStatuses = ['cancelled', 'deceased'];

    if (completedStatuses.includes(status)) return 'default' as const;
    if (activeStatuses.includes(status)) return 'secondary' as const;
    if (dangerStatuses.includes(status)) return 'destructive' as const;
    if (warningStatuses.includes(status)) return 'outline' as const;
    return 'outline' as const;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="py-12 text-center">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertDescription>{error || 'Patient not found'}</AlertDescription>
        </Alert>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/patients')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/patients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {patient.firstName} {patient.middleName ? `${patient.middleName} ` : ''}
              {patient.lastName}
            </h1>
            <p className="text-muted-foreground">
              CHI: <span className="font-mono">{patient.chiNumber}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={patient.isActive ? 'default' : 'secondary'} className="text-sm">
            {patient.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Button variant="outline" onClick={() => router.push(`/patients/${patient.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant={patient.isActive ? 'destructive' : 'default'}
            onClick={handleStatusChange}
            disabled={statusLoading}
          >
            {statusLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : patient.isActive ? (
              <XCircle className="mr-2 h-4 w-4" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {patient.isActive ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      </div>

      {statusMessage && (
        <Alert variant={statusMessage.includes('success') ? 'success' : 'destructive'}>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      )}

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="text-xl font-bold">{calculateAge(patient.dateOfBirth)} years</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="text-xl font-bold capitalize">{patient.gender}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Allergies</p>
                <p className="text-xl font-bold">{allergiesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Medical Aid</p>
                <p className="text-xl font-bold">{medicalAidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Location Banner */}
      {locationBanner && (
        <div
          className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium ${
            locationBanner.variant === 'blue'
              ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
              : locationBanner.variant === 'amber'
              ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800'
          }`}
        >
          {locationBanner.icon}
          <span>{locationBanner.text}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList className="flex flex-wrap w-full">
          <TabsTrigger value="demographics" className="gap-2">
            <User className="h-4 w-4 hidden sm:inline" />
            Demographics
          </TabsTrigger>
          <TabsTrigger value="nextOfKin" className="gap-2">
            <Users className="h-4 w-4 hidden sm:inline" />
            Next of Kin
          </TabsTrigger>
          <TabsTrigger value="allergies" className="gap-2">
            <AlertTriangle className="h-4 w-4 hidden sm:inline" />
            Allergies
          </TabsTrigger>
          <TabsTrigger value="medicalHistory" className="gap-2">
            <FileText className="h-4 w-4 hidden sm:inline" />
            History
          </TabsTrigger>
          <TabsTrigger value="medicalAid" className="gap-2">
            <CreditCard className="h-4 w-4 hidden sm:inline" />
            Medical Aid
          </TabsTrigger>
          <TabsTrigger value="encounters" className="gap-2">
            <Activity className="h-4 w-4 hidden sm:inline" />
            Encounters
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <CalendarDays className="h-4 w-4 hidden sm:inline" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="discharge" className="gap-2">
            <ClipboardList className="h-4 w-4 hidden sm:inline" />
            Discharge
          </TabsTrigger>
          <TabsTrigger value="journey" className="gap-2">
            <GitCommitHorizontal className="h-4 w-4 hidden sm:inline" />
            Journey
          </TabsTrigger>
        </TabsList>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Full Name" value={`${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`} />
                <InfoRow label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
                <InfoRow label="Gender" value={patient.gender} capitalize />
                <InfoRow label="Marital Status" value={patient.maritalStatus} capitalize />
                <InfoRow label="Nationality" value={patient.nationality} />
                <InfoRow label="Ethnicity" value={patient.ethnicity} />
                <InfoRow label="Preferred Language" value={patient.preferredLanguage} />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Email" value={patient.email} icon={<Mail className="h-4 w-4" />} />
                <InfoRow label="Primary Phone" value={patient.phonePrimary} icon={<Phone className="h-4 w-4" />} />
                <InfoRow label="Secondary Phone" value={patient.phoneSecondary} icon={<Phone className="h-4 w-4" />} />
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Address Line 1" value={patient.addressLine1} />
                <InfoRow label="Address Line 2" value={patient.addressLine2} />
                <InfoRow label="City" value={patient.city} />
                <InfoRow label="County" value={patient.county} />
                <InfoRow label="Post Code" value={patient.postCode} />
                <InfoRow label="Country" value={patient.country} />
              </CardContent>
            </Card>

            {/* GP Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  GP Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="GP Name" value={patient.gpName} />
                <InfoRow label="Practice Name" value={patient.gpPracticeName} />
                <InfoRow label="Practice Address" value={patient.gpPracticeAddress} />
                <InfoRow label="GP Phone" value={patient.gpPhone} />
                <InfoRow label="GP Email" value={patient.gpEmail} />
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {patient.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{patient.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Audit Info */}
          <Card>
            <CardHeader>
              <CardTitle>Record Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow label="Created" value={formatDate(patient.createdAt)} />
                <InfoRow label="Last Updated" value={formatDate(patient.updatedAt)} />
                {patient.deactivatedAt && (
                  <InfoRow label="Deactivated" value={formatDate(patient.deactivatedAt)} />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Next of Kin Tab */}
        <TabsContent value="nextOfKin">
          <NextOfKinSection
            patientId={patient.id}
            initialData={patient.nextOfKin || []}
            onCountChange={setNextOfKinCount}
          />
        </TabsContent>

        {/* Allergies Tab */}
        <TabsContent value="allergies">
          <AllergiesSection
            patientId={patient.id}
            initialData={patient.allergies || []}
            onCountChange={setAllergiesCount}
          />
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="medicalHistory">
          <MedicalHistorySection
            patientId={patient.id}
            initialData={patient.medicalHistory || []}
            onCountChange={setMedicalHistoryCount}
          />
        </TabsContent>

        {/* Medical Aid Tab */}
        <TabsContent value="medicalAid">
          <MedicalAidSection
            patientId={patient.id}
            initialData={patient.medicalAid || []}
            onCountChange={setMedicalAidCount}
          />
        </TabsContent>

        {/* Encounters Tab */}
        <TabsContent value="encounters">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Clinical Encounters ({encounters.length})
              </CardTitle>
              <CardDescription>All clinical visits and encounters for this patient</CardDescription>
            </CardHeader>
            <CardContent>
              {encounters.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No encounters recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {encounters.map((enc) => (
                    <div key={enc.id} className="flex items-start justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={enc.status === 'discharged' ? 'default' : enc.status === 'in_treatment' ? 'secondary' : 'outline'}>
                            {enc.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">{(enc.encounterType || enc.type || '').replace(/_/g, ' ')}</Badge>
                        </div>
                        <p className="text-sm font-medium">{enc.chiefComplaint || 'No chief complaint recorded'}</p>
                        {(enc.admissionDiagnosis || enc.dischargeDiagnosis) && <p className="text-sm text-muted-foreground">Diagnosis: {enc.admissionDiagnosis || enc.dischargeDiagnosis}</p>}
                        <p className="text-xs text-muted-foreground">
                          {new Date(enc.admissionDate).toLocaleDateString('en-GB')}
                          {enc.doctorName && ` - Dr. ${enc.doctorName}`}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/ward`)}>
                        Ward View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Appointments ({appointments.length})
                </CardTitle>
                <CardDescription>Scheduled and past appointments</CardDescription>
              </div>
              <Button size="sm" onClick={() => router.push(`/appointments/new?patientId=${patient.id}`)}>
                <CalendarDays className="mr-2 h-4 w-4" />
                New Appointment
              </Button>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No appointments found.</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="flex items-start justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            apt.status === 'completed' ? 'default' :
                            apt.status === 'confirmed' ? 'secondary' :
                            apt.status === 'cancelled' ? 'destructive' : 'outline'
                          }>
                            {apt.status}
                          </Badge>
                          <Badge variant="outline">{(apt.appointmentType || apt.type || '').replace(/_/g, ' ')}</Badge>
                        </div>
                        <p className="text-sm font-medium">
                          {new Date(apt.scheduledDate).toLocaleDateString('en-GB')} at {apt.scheduledTime || new Date(apt.scheduledDate).toTimeString().slice(0, 5)}
                        </p>
                        {apt.doctorName && <p className="text-sm text-muted-foreground">With: Dr. {apt.doctorName}</p>}
                        {apt.reason && <p className="text-xs text-muted-foreground">{apt.reason}</p>}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/appointments?patientId=${patient.id}`)}>
                        View All
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discharge Forms Tab (Enhanced) */}
        <TabsContent value="discharge">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Discharge Forms ({dischargeForms.length})
              </CardTitle>
              <CardDescription>All discharge forms for this patient</CardDescription>
            </CardHeader>
            <CardContent>
              {dischargeForms.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No discharge forms found.</p>
              ) : (
                <div className="space-y-3">
                  {dischargeForms.map((form) => {
                    const isExpanded = expandedDischargeId === form.id;
                    return (
                      <div key={form.id} className="rounded-lg border">
                        {/* Collapsed view - always visible */}
                        <button
                          type="button"
                          className="flex w-full items-start justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedDischargeId(isExpanded ? null : form.id)}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={
                                form.status === 'active' ? 'secondary' :
                                form.status === 'completed' ? 'default' :
                                form.status === 'pending_review' ? 'outline' : 'destructive'
                              }>
                                {form.status.replace('_', ' ')}
                              </Badge>
                              {form.dischargeType && (
                                <Badge variant="outline">{form.dischargeType.replace('_', ' ')}</Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium">
                              {form.primaryDiagnosis || 'No diagnosis recorded'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Admitted: {new Date(form.admissionDate).toLocaleDateString('en-GB')}
                              {form.dischargeDate && ` \u2014 Discharged: ${new Date(form.dischargeDate).toLocaleDateString('en-GB')}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            {form.status === 'active' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/discharge/${form.id}`);
                                }}
                              >
                                Continue Editing
                              </Button>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Expanded view */}
                        {isExpanded && (
                          <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
                            <div className="grid gap-4 md:grid-cols-2">
                              {/* Clinical Summary */}
                              {form.clinicalSummary && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Clinical Summary</p>
                                  <p className="text-sm whitespace-pre-wrap">{form.clinicalSummary}</p>
                                </div>
                              )}

                              {/* Treatment Provided */}
                              {form.treatmentProvided && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Treatment Provided</p>
                                  <p className="text-sm whitespace-pre-wrap">{form.treatmentProvided}</p>
                                </div>
                              )}

                              {/* Secondary Diagnoses */}
                              {form.secondaryDiagnoses && form.secondaryDiagnoses.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Secondary Diagnoses</p>
                                  <ul className="text-sm list-disc list-inside space-y-0.5">
                                    {form.secondaryDiagnoses.map((d, i) => (
                                      <li key={i}>{d}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Medications on Discharge */}
                            {form.medicationsOnDischarge && form.medicationsOnDischarge.length > 0 && (
                              <>
                                <Separator />
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <Pill className="h-3.5 w-3.5" />
                                    Medications on Discharge
                                  </p>
                                  <div className="space-y-2">
                                    {form.medicationsOnDischarge.map((med, i) => (
                                      <div key={i} className="text-sm rounded border p-2 bg-background">
                                        <p className="font-medium">{med.name} {med.dosage}</p>
                                        <p className="text-muted-foreground text-xs">
                                          {med.frequency} &middot; {med.route} &middot; {med.duration}
                                        </p>
                                        {med.instructions && <p className="text-xs mt-0.5">{med.instructions}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Operations and Procedures */}
                            {form.operationsAndProcedures && form.operationsAndProcedures.length > 0 && (
                              <>
                                <Separator />
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <Scissors className="h-3.5 w-3.5" />
                                    Operations &amp; Procedures
                                  </p>
                                  <div className="space-y-2">
                                    {form.operationsAndProcedures.map((proc, i) => (
                                      <div key={i} className="text-sm rounded border p-2 bg-background">
                                        <p className="font-medium">{proc.name}</p>
                                        <p className="text-muted-foreground text-xs">
                                          {new Date(proc.date).toLocaleDateString('en-GB')} &middot; {proc.surgeon}
                                        </p>
                                        {proc.outcome && <p className="text-xs mt-0.5">Outcome: {proc.outcome}</p>}
                                        {proc.notes && <p className="text-xs text-muted-foreground">{proc.notes}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Nursing Notes */}
                            {form.nursingNotes && (
                              <>
                                <Separator />
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Nursing Notes</p>
                                  <p className="text-sm whitespace-pre-wrap">{form.nursingNotes}</p>
                                </div>
                              </>
                            )}

                            {/* Pharmacy Notes */}
                            {form.pharmacyNotes && (
                              <>
                                <Separator />
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Pharmacy Notes</p>
                                  <p className="text-sm whitespace-pre-wrap">{form.pharmacyNotes}</p>
                                  {form.pharmacyReviewedBy && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Reviewed by: {form.pharmacyReviewedBy}
                                      {form.pharmacyReviewedAt && ` on ${new Date(form.pharmacyReviewedAt).toLocaleString('en-GB')}`}
                                    </p>
                                  )}
                                </div>
                              </>
                            )}

                            {/* Follow-up Instructions */}
                            {form.followUpInstructions && (
                              <>
                                <Separator />
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-up Instructions</p>
                                  <p className="text-sm whitespace-pre-wrap">{form.followUpInstructions}</p>
                                  {form.followUpDate && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Follow-up date: {new Date(form.followUpDate).toLocaleDateString('en-GB')}
                                      {form.followUpDoctor && ` with ${form.followUpDoctor}`}
                                    </p>
                                  )}
                                </div>
                              </>
                            )}

                            {/* Activity Restrictions & Dietary Instructions */}
                            <div className="grid gap-4 md:grid-cols-2">
                              {form.activityRestrictions && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Activity Restrictions</p>
                                  <p className="text-sm whitespace-pre-wrap">{form.activityRestrictions}</p>
                                </div>
                              )}
                              {form.dietaryInstructions && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Dietary Instructions</p>
                                  <p className="text-sm whitespace-pre-wrap">{form.dietaryInstructions}</p>
                                </div>
                              )}
                            </div>

                            {/* Patient Education */}
                            {form.patientEducation && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Patient Education</p>
                                <p className="text-sm whitespace-pre-wrap">{form.patientEducation}</p>
                              </div>
                            )}

                            {/* Meta info */}
                            <Separator />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Version: {form.version} | Last updated: {new Date(form.updatedAt).toLocaleString('en-GB')}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/discharge/${form.id}`)}
                              >
                                {form.status === 'active' ? 'Continue Editing' : 'View Full Form'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journey Tab */}
        <TabsContent value="journey">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCommitHorizontal className="h-5 w-5" />
                Patient Journey ({journeyTimeline.length} events)
              </CardTitle>
              <CardDescription>Chronological timeline of all patient events</CardDescription>
            </CardHeader>
            <CardContent>
              {journeyTimeline.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No clinical events recorded yet.</p>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

                    <div className="space-y-1">
                      {journeyTimeline.map((event) => (
                        <div key={event.id} className="relative flex gap-4 pb-6">
                          {/* Timeline dot */}
                          <div
                            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-background ${
                              event.type === 'emergency'
                                ? 'border-red-400 text-red-600'
                                : event.type === 'encounter'
                                ? 'border-blue-400 text-blue-600'
                                : event.type === 'appointment'
                                ? 'border-green-400 text-green-600'
                                : 'border-orange-400 text-orange-600'
                            }`}
                          >
                            {event.icon}
                          </div>

                          {/* Event content */}
                          <div className="flex-1 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {event.label}
                                  </span>
                                  <Badge variant={getJourneyStatusVariant(event.type, event.status)}>
                                    {event.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium leading-snug">{event.summary}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(event.date).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}{' '}
                                    {new Date(event.date).toLocaleTimeString('en-GB', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  {event.clinician && (
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {event.clinician}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {event.linkTo && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="shrink-0"
                                  onClick={() => router.push(event.linkTo!)}
                                >
                                  View
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({
  label,
  value,
  capitalize = false,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  capitalize?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className={`text-sm font-medium text-right ${capitalize ? 'capitalize' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}
