'use client';

import { useState, useCallback } from 'react';

export interface Toast {
  type: 'success' | 'error';
  message: string;
}

export function useToast(duration = 4000) {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback(
    (type: 'success' | 'error', message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), duration);
    },
    [duration]
  );

  const dismissToast = useCallback(() => setToast(null), []);

  return { toast, showToast, dismissToast };
}
