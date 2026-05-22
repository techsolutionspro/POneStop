'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookiePreferences {
  essential: boolean;    // Always true — required
  analytics: boolean;    // Google Analytics, Hotjar, etc.
  marketing: boolean;    // Ad tracking, remarketing pixels
  functional: boolean;   // Chat widgets, preferences, A/B testing
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
};

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function saveConsent(prefs: CookiePreferences) {
    const consentData = {
      preferences: prefs,
      timestamp: new Date().toISOString(),
      version: '2.0',
    };
    localStorage.setItem('cookie_consent', JSON.stringify(consentData));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());

    // Remove non-consented cookies
    if (!prefs.analytics) {
      deleteCookiesByPrefix(['_ga', '_gid', '_gat', '_hj']);
    }
    if (!prefs.marketing) {
      deleteCookiesByPrefix(['_fbp', '_fbc', '_gcl']);
    }

    setVisible(false);
  }

  function acceptAll() {
    saveConsent({ essential: true, analytics: true, marketing: true, functional: true });
  }

  function acceptEssential() {
    saveConsent(DEFAULT_PREFERENCES);
  }

  function saveCustom() {
    saveConsent(preferences);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6" role="dialog" aria-label="Cookie consent" aria-describedby="cookie-description">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Your Privacy Matters</h3>
              <p id="cookie-description" className="text-sm text-gray-500 leading-relaxed">
                We use cookies and similar technologies to provide our services. Essential cookies are required for the platform to function.
                Optional cookies help us improve your experience and show relevant content.
                You can manage your preferences at any time.{' '}
                <Link href="/cookies" className="text-teal-600 hover:underline font-medium">Cookie Policy</Link>
                {' '}&middot;{' '}
                <Link href="/privacy" className="text-teal-600 hover:underline font-medium">Privacy Policy</Link>
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                aria-expanded={showPreferences}
              >
                Manage
              </button>
              <button
                onClick={acceptEssential}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Essential Only
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>

          {/* Granular Preferences */}
          {showPreferences && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              <CookieCategory
                label="Essential Cookies"
                description="Required for the platform to function. These cannot be disabled."
                checked={true}
                disabled={true}
                onChange={() => {}}
              />
              <CookieCategory
                label="Analytics Cookies"
                description="Help us understand how visitors use our platform to improve the experience."
                checked={preferences.analytics}
                onChange={(v) => setPreferences(p => ({ ...p, analytics: v }))}
              />
              <CookieCategory
                label="Marketing Cookies"
                description="Used to show you relevant advertisements and measure campaign effectiveness."
                checked={preferences.marketing}
                onChange={(v) => setPreferences(p => ({ ...p, marketing: v }))}
              />
              <CookieCategory
                label="Functional Cookies"
                description="Enable enhanced features like live chat, saved preferences, and A/B testing."
                checked={preferences.functional}
                onChange={(v) => setPreferences(p => ({ ...p, functional: v }))}
              />
              <div className="flex justify-end pt-2">
                <button
                  onClick={saveCustom}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CookieCategory({ label, description, checked, disabled, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? '' : 'cursor-pointer'}`}>
      <div className="pt-0.5">
        <button
          role="switch"
          aria-checked={checked}
          aria-label={label}
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            checked ? 'bg-teal-600' : 'bg-gray-200'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`} />
        </button>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">
          {label}
          {disabled && <span className="ml-2 text-[10px] text-gray-400 font-normal">Always active</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </label>
  );
}

function deleteCookiesByPrefix(prefixes: string[]) {
  if (typeof document === 'undefined') return;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const name = cookie.split('=')[0].trim();
    if (prefixes.some(p => name.startsWith(p))) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  }
}

// Helper to check if user has consented to a category
export function hasCookieConsent(category: keyof CookiePreferences): boolean {
  if (typeof window === 'undefined') return false;
  const consent = localStorage.getItem('cookie_consent');
  if (!consent) return false;
  try {
    const parsed = JSON.parse(consent);
    return parsed.preferences?.[category] === true;
  } catch {
    // Legacy format: stored as plain string 'all' or 'essential'
    return consent === 'all';
  }
}
