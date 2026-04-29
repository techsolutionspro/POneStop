'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept(level: 'all' | 'essential') {
    localStorage.setItem('cookie_consent', level);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">We use cookies</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            We use essential cookies to make our platform work. We&apos;d also like to use analytics cookies to improve your experience.{' '}
            <Link href="/cookies" className="text-teal-600 hover:underline font-medium">Learn more</Link>
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => accept('essential')}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={() => accept('all')}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
