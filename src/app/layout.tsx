import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import '@/styles/index.css';

export const metadata: Metadata = {
  title: 'BharatSmartTour | Smart Tourism & Hospitality Platform for India',
  description: 'Discover India, Every Step of the Way. Trust-first AI itinerary planning, dynamic weather rerouting, fair-price & scam shield, cultural etiquette, and verified homestays.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
