import type { Metadata } from "next";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Providers } from "@/components/shared/Providers";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: "Ghoomo | Social-to-Itinerary Travel Platform for India",
  description:
    "Transform Instagram Reels, TikTok, YouTube Shorts, and blogs into practical, collaborative, map-based itineraries across India.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#fafafa] text-slate-900 antialiased selection:bg-teal-600/20 selection:text-teal-700">
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
