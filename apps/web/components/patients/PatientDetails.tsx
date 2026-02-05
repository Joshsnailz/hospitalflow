'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { patientsApi } from '@/lib/api/patients';
import type { Patient } from '@/lib/types/patient';
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

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

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

      {/* Tabs */}
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
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
