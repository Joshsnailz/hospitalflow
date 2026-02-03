'use client';

import { HelpCircle } from 'lucide-react';

export default function HelpdeskPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <HelpCircle className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Helpdesk</h1>
      <p className="text-gray-500 max-w-md">
        Submit and track support tickets. Get help with system issues, report bugs, or request new features.
      </p>
    </div>
  );
}
