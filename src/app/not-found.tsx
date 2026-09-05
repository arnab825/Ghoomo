import React from 'react';
import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem', textAlign: 'center', borderRadius: '1rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--saffron)', borderRadius: '50%', marginBottom: '1.25rem' }}>
          <Compass size={36} />
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          404 - Page Not Found
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          The destination or page you are searching for does not exist or has moved. Let&apos;s get your journey back on course.
        </p>

        <Link
          href="/"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
        >
          <Home size={16} /> Return to Home
        </Link>
      </div>
    </div>
  );
}
