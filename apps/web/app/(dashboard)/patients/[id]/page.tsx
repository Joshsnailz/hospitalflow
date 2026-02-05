'use client';

import { use } from 'react';
import { PatientDetails } from '@/components/patients/PatientDetails';

interface PatientPageProps {
  params: Promise<{ id: string }>;
}

export default function PatientPage({ params }: PatientPageProps) {
  const { id } = use(params);

  return <PatientDetails patientId={id} />;
}
