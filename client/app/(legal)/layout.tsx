import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Pharmacy One Stop" className="w-7 h-7" />
            <span className="font-bold text-gray-900">Pharmacy One Stop</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
            <Link href="/cookies" className="hover:text-gray-900">Cookies</Link>
            <Link href="/gdpr" className="hover:text-gray-900">GDPR</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-12">{children}</main>
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-gray-400">
          &copy; 2026 Pharmacy One Stop. All rights reserved. Built by TSP.
        </div>
      </footer>
    </div>
  );
}
