'use client';

import { use, useState, useEffect } from 'react';
import { PatientForm } from '@/components/patients/PatientForm';
import { patientsApi } from '@/lib/api/patients';
import type { Patient } from '@/lib/types/patient';
import { Loader2 } from 'lucide-react';

interface EditPatientPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPatientPage({ params }: EditPatientPageProps) {
  const { id } = use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await patientsApi.findOne(id);
        setPatient(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load patient');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="py-12 text-center text-red-600">
        {error || 'Patient not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Patient</h1>
        <p className="text-muted-foreground">
          Update patient information for {patient.firstName} {patient.lastName}
        </p>
      </div>
      <PatientForm mode="edit" patient={patient} />
    </div>
  );
}
