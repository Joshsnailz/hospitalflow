'use client';

import { useEffect, useRef } from 'react';

export function useAutoRefresh(callback: () => void, intervalMs = 30000) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const interval = setInterval(() => callbackRef.current(), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);
}
