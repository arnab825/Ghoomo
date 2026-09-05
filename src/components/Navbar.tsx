'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, ShieldAlert, Store, BookOpen, Languages, Users, UserCheck } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home', icon: Compass },
    { href: '/itinerary', label: 'AI Itinerary', icon: Compass },
    { href: '/scam-shield', label: 'Scam Shield', icon: ShieldAlert },
    { href: '/marketplace', label: 'Verified Stays', icon: Store },
    { href: '/etiquette', label: 'Cultural Rules', icon: BookOpen },
    { href: '/translator', label: 'Translator', icon: Languages },
    { href: '/group-collab', label: 'Group Room', icon: Users },
  ];

  return (
    <header className="navbar-wrapper">
      <div className="container nav-container">
        {/* Brand Logo */}
        <Link href="/" className="nav-brand">
          <div className="brand-logo-badge">
            <Compass className="brand-icon" size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">Bharat<span className="gradient-text-saffron">SmartTour</span></span>
            <span className="brand-subtitle">SIH 2026 • Discover India</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="nav-menu">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth / Action */}
        <div className="nav-actions">
          <Link href="/auth" className="btn btn-secondary nav-btn-auth">
            <UserCheck size={16} />
            <span>Demo Login</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

