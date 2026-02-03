'use client';

import { Pill } from 'lucide-react';

export default function PharmacyDischargePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <Pill className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pharmacy Discharge List</h1>
      <p className="text-gray-500 max-w-md">
        View and manage patients pending pharmacy review for discharge. Review discharge medications and complete pharmacy sign-off.
      </p>
    </div>
  );
}
