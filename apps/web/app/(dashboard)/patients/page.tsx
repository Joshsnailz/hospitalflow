'use client';

import { PatientList } from '@/components/patients/PatientList';

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Patient Management</h1>
        <p className="text-muted-foreground">
          Search, view, and manage patient records
        </p>
      </div>
      <PatientList />
    </div>
  );
}
