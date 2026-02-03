'use client';

import { Search } from 'lucide-react';

export default function PatientSearchPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <Search className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Search</h1>
      <p className="text-gray-500 max-w-md">
        Search for patients by CHI Number, name, date of birth, or other criteria. Find and access patient records quickly.
      </p>
    </div>
  );
}
