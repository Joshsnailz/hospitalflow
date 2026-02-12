'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RescheduleRequestsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/appointments?tab=requests');
  }, [router]);

  return null;
}
