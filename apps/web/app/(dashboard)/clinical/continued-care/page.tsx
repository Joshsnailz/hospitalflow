'use client';

import { RefreshCw } from 'lucide-react';

export default function ContinuedCarePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <RefreshCw className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Continued Care</h1>
      <p className="text-gray-500 max-w-md">
        Manage ongoing patient care plans and follow-up appointments. Track long-term treatment progress and care coordination.
      </p>
    </div>
  );
}
