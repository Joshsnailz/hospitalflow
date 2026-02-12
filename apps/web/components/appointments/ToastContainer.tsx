'use client';

import type { Toast } from '@/hooks/use-toast';
import { AlertCircle, CalendarClock } from 'lucide-react';

interface ToastContainerProps {
  toast: Toast | null;
}

export function ToastContainer({ toast }: ToastContainerProps) {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[100] max-w-sm rounded-lg border px-4 py-3 shadow-lg transition-all ${
        toast.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      <div className="flex items-center gap-2">
        {toast.type === 'success' ? (
          <CalendarClock className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    </div>
  );
}
