'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QueueRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/appointments?tab=queue');
  }, [router]);

  return null;
}
