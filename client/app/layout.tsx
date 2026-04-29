import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { CookieBanner } from '@/components/ui/cookie-banner';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pharmacy One Stop",
  description: "UK B2B healthcare enablement platform for community pharmacies. Launch, run, and scale clinical services.",
  keywords: "pharmacy, clinical services, PGD, healthcare, SaaS, UK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} style={{ colorScheme: 'light' }}>
      <body className="min-h-full flex flex-col font-sans bg-white text-gray-900">
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: '14px' } }} />
        <CookieBanner />
      </body>
    </html>
  );
}
