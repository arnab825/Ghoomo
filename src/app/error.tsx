'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log full error details server-side/console for developer debugging
    console.error('[App Error Boundary Caught Exception]:', {
      message: error?.message,
      stack: error?.stack,
      digest: error?.digest,
      cause: (error as any)?.cause,
    });
  }, [error]);

  return (
    <div className="container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem', textAlign: 'center', borderRadius: '1rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', marginBottom: '1.25rem' }}>
          <AlertTriangle size={36} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Something went wrong
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          We encountered an unexpected issue while loading this experience. Our system has safely logged the technical details for review.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => reset()}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
          >
            <RefreshCw size={16} /> Try Again
          </button>

          <Link
            href="/"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
          >
            <Home size={16} /> Return to Home
          </Link>
        </div>

        {error?.digest && (
          <p style={{ marginTop: '1.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Error Reference ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
