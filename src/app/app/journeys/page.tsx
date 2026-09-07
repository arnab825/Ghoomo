'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JourneysIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/app/knowledge');
  }, [router]);

  return null;
}
