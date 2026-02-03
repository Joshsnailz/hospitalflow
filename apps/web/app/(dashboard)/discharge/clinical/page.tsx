'use client';

import { ClipboardList } from 'lucide-react';

export default function ClinicalDischargePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <ClipboardList className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Clinical Discharge List</h1>
      <p className="text-gray-500 max-w-md">
        View and manage patients pending clinical review for discharge. Complete clinical assessments and approve discharge forms.
      </p>
    </div>
  );
}
