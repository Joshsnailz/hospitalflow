'use client';

import { Pill } from 'lucide-react';

export default function ControlledDrugsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <Pill className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Controlled Drugs</h1>
      <p className="text-gray-500 max-w-md">
        Manage controlled drug prescriptions and inventory. Track controlled substance dispensing and maintain compliance records.
      </p>
    </div>
  );
}
