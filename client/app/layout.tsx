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
  other: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:4000 https://*.pharmacyonestop.co.uk https://*.stripe.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} style={{ colorScheme: 'light' }}>
      <body className="min-h-full flex flex-col font-sans bg-white text-gray-900">
        {/* Skip to main content link for keyboard navigation (WCAG 2.1 AA) */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-teal-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <main id="main-content">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: '14px' },
            ariaProps: { role: 'status', 'aria-live': 'polite' },
          }}
        />
        <CookieBanner />
      </body>
    </html>
  );
}
