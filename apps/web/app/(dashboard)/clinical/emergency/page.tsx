'use client';

import { Ambulance } from 'lucide-react';

export default function EmergencyCarePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <Ambulance className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Emergency Care Services</h1>
      <p className="text-gray-500 max-w-md">
        Access emergency care workflows and patient management. Handle urgent cases, triage, and emergency admissions.
      </p>
    </div>
  );
}
