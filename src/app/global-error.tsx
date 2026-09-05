'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[Global Error Boundary Caught Exception]:', {
      message: error?.message,
      stack: error?.stack,
      digest: error?.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0a0f1d', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '2.5rem', borderRadius: '1rem', backdropFilter: 'blur(12px)' }}>
          <div style={{ color: '#f87171', marginBottom: '1rem', display: 'inline-flex' }}>
            <AlertOctagon size={44} />
          </div>
          <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.75rem 0' }}>Application Unavailable</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            A critical system error occurred. Technical diagnostic details have been securely logged.
          </p>
          <button
            onClick={() => reset()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
          >
            <RefreshCw size={16} /> Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
