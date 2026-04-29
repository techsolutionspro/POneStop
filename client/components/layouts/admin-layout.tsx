'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { Avatar } from '@/components/ui/avatar';
import {
  LayoutDashboard, Stethoscope, Calendar, ShoppingBag, ClipboardList,
  Package, Truck, Users, BarChart3, Megaphone, CreditCard, Globe,
  UserCog, Building2, Settings, LogOut, Bell, Search, ChevronDown, Menu, X,
} from 'lucide-react';
import { CommandPalette } from '@/components/ui/command-palette';

interface AdminLayoutProps {
  children: ReactNode;
}

const navSections = [
  {
    label: 'Main',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/admin/services', icon: Stethoscope, label: 'Services' },
      { href: '/admin/bookings', icon: Calendar, label: 'Bookings' },
      { href: '/admin/orders', icon: ShoppingBag, label: 'Online Orders', badge: true },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { href: '/admin/prescriber-queue', icon: ClipboardList, label: 'Prescriber Queue', badgeWarn: true },
      { href: '/admin/dispensing', icon: Package, label: 'Dispensing' },
      { href: '/admin/dispatch', icon: Truck, label: 'Dispatch' },
      { href: '/admin/patients', icon: Users, label: 'Patients' },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
      { href: '/admin/marketing', icon: Megaphone, label: 'Marketing' },
      { href: '/admin/billing', icon: CreditCard, label: 'Billing' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/domain', icon: Globe, label: 'Domain & Website' },
      { href: '/admin/team', icon: UserCog, label: 'Team' },
      { href: '/admin/branches', icon: Building2, label: 'Branches' },
      { href: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {user?.tenant?.name?.charAt(0) || 'P'}
        </div>
        {(isMobile || sidebarOpen) && (
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{user?.tenant?.name || 'Pharmacy'}</div>
            <div className="text-xs text-gray-400 truncate">{user?.tenant?.tier || 'Professional'} Plan</div>
          </div>
        )}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-600 ml-auto">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navSections.map((section) => (
          <div key={section.label} className="px-3 mb-3">
            {(isMobile || sidebarOpen) && (
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 mb-1">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5',
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0', isActive ? 'opacity-100' : 'opacity-60')} />
                  {(isMobile || sidebarOpen) && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 p-4 flex items-center gap-3">
        {user && <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />}
        {(isMobile || sidebarOpen) && user && (
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user.firstName} {user.lastName}</div>
            <div className="text-xs text-gray-400 truncate">{user.role.replace('_', ' ')}</div>
          </div>
        )}
        {(isMobile || sidebarOpen) && (
          <button onClick={() => logout()} className="text-gray-400 hover:text-gray-600">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {sidebarContent(true)}
      </aside>

      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-200',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        {sidebarContent(false)}
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(true)} className="text-gray-500 hover:text-gray-700 md:hidden">
              <Menu className="w-5 h-5" />
            </button>
            {/* Desktop sidebar toggle */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700 hidden md:block">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-72">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                className="bg-transparent text-sm outline-none w-full"
                placeholder="Search patients, orders, bookings..."
                onFocus={(e) => {
                  e.target.blur();
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <Link href="/admin/bookings/new" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
              + New Booking
            </Link>
            <Link href="/admin/bookings/new" className="sm:hidden inline-flex items-center justify-center w-9 h-9 bg-teal-600 text-white text-sm font-bold rounded-lg hover:bg-teal-700 transition-colors">
              +
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>

      <CommandPalette />
    </div>
  );
}
