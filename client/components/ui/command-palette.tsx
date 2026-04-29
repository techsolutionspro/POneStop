'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Stethoscope, Calendar, ShoppingBag, ClipboardList,
  Users, UserCog, Settings, Search, BarChart3, Package, Truck, CreditCard,
} from 'lucide-react';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/services', label: 'Services', icon: Stethoscope },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/orders', label: 'Online Orders', icon: ShoppingBag },
  { href: '/admin/prescriber-queue', label: 'Prescriber Queue', icon: ClipboardList },
  { href: '/admin/dispensing', label: 'Dispensing', icon: Package },
  { href: '/admin/dispatch', label: 'Dispatch', icon: Truck },
  { href: '/admin/patients', label: 'Patients', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/admin/team', label: 'Team', icon: UserCog },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = links.filter((l) =>
    l.label.toLowerCase().includes(query.toLowerCase())
  );

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => {
          if (!prev) {
            setQuery('');
            setSelectedIndex(0);
          }
          return !prev;
        });
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function navigate(href: string) {
    router.push(href);
    closePalette();
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      closePalette();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault();
      navigate(filtered[selectedIndex].href);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={closePalette} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
            placeholder="Search pages... (type to filter)"
          />
          <kbd className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded border border-gray-200">
            ESC
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">No results found</div>
          ) : (
            filtered.map((link, index) => (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  index === selectedIndex
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <link.icon className="w-4 h-4 opacity-60" />
                <span className="font-medium">{link.label}</span>
                <span className="ml-auto text-xs text-gray-400">{link.href}</span>
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-[10px] text-gray-400">
          <span><kbd className="px-1 py-0.5 bg-white border rounded text-[9px]">↑↓</kbd> navigate</span>
          <span><kbd className="px-1 py-0.5 bg-white border rounded text-[9px]">↵</kbd> open</span>
          <span><kbd className="px-1 py-0.5 bg-white border rounded text-[9px]">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
