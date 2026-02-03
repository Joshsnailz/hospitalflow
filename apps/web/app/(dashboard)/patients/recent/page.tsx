'use client';

import { Users } from 'lucide-react';

export default function RecentPatientsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <Users className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Recent Patients</h1>
      <p className="text-gray-500 max-w-md">
        View your recently accessed patients. This page will display the top 50 patients you have recently viewed or interacted with.
      </p>
    </div>
  );
}
