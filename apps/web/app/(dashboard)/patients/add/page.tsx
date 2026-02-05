'use client';

import { PatientForm } from '@/components/patients/PatientForm';

export default function AddPatientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Patient</h1>
        <p className="text-muted-foreground">
          Register a new patient in the system
        </p>
      </div>
      <PatientForm mode="create" />
    </div>
  );
}
