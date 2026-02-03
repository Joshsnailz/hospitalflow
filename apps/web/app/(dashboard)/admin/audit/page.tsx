'use client';

import { ScrollText } from 'lucide-react';

export default function AuditTrailsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <ScrollText className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Audit Trails</h1>
      <p className="text-gray-500 max-w-md">
        View system audit logs and user activity. Track all actions, data access, and changes made within the system for compliance and security.
      </p>
    </div>
  );
}
