import type { Metadata } from "next";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Providers } from "@/components/shared/Providers";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: "Ghoomo | AI-Powered Smart Learning Journeys",
  description:
    "Turn digital content, curriculum topics, and real-world places into personalized experiential learning journeys.",
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
        className="min-h-screen flex flex-col bg-[#fbfbfa] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500/20 selection:text-indigo-600 transition-colors duration-200"
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
