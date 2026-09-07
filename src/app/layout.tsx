import type { Metadata } from "next";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Providers } from "@/components/shared/Providers";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: "Ghoomo | Smart Personalized Learning Guide",
  description:
    "Intelligent turn-by-turn guidance for learners. Automatically personalizes your roadmap, finds the fastest route to mastery, and adapts when you need review.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-600 transition-colors duration-200"
      >
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
