'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ItineraryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/trips');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center p-12 text-slate-400 text-sm">
      Redirecting to Ghoomo Workspaces...
    </div>
  );
}
