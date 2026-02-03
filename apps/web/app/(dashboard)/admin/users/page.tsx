'use client';

import { Shield } from 'lucide-react';

export default function UserManagementPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <Shield className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
      <p className="text-gray-500 max-w-md">
        Manage system users, roles, and permissions. Create new users, assign roles, and control access to system features.
      </p>
    </div>
  );
}
