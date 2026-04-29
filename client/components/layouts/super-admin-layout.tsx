'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import {
  LayoutDashboard, Building2, FileText, ClipboardCheck, Sliders,
  Globe, BarChart3, HeadphonesIcon, Shield, CreditCard, LogOut, Users,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', items: [
    { href: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/super-admin/tenants', icon: Building2, label: 'Tenants' },
  ]},
  { label: 'Clinical', items: [
    { href: '/super-admin/pgds', icon: FileText, label: 'PGD Library' },
    { href: '/super-admin/dsp-register', icon: ClipboardCheck, label: 'DSP Register' },
  ]},
  { label: 'Platform', items: [
    { href: '/super-admin/tiers', icon: Sliders, label: 'Tiers & Features' },
    { href: '/super-admin/domains', icon: Globe, label: 'Domains & DNS' },
    { href: '/super-admin/monitoring', icon: BarChart3, label: 'Monitoring' },
  ]},
  { label: 'Operations', items: [
    { href: '/super-admin/team', icon: Users, label: 'Platform Team' },
    { href: '/super-admin/support', icon: HeadphonesIcon, label: 'Support' },
    { href: '/super-admin/audit', icon: Shield, label: 'Audit Logs' },
    { href: '/super-admin/billing', icon: CreditCard, label: 'Billing Ops' },
  ]},
];

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-60 bg-gray-900 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold text-xs">P1S</div>
          <div>
            <div className="text-sm font-semibold text-white">Pharmacy One Stop</div>
            <div className="text-xs text-gray-500">Platform Admin</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map((section) => (
            <div key={section.label} className="px-3 mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 px-3 mb-1">{section.label}</div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/super-admin' && pathname?.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5',
                      isActive ? 'bg-teal-500/15 text-teal-400 font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    )}>
                    <item.icon className="w-[18px] h-[18px] opacity-70" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-semibold">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">{user?.firstName} {user?.lastName}</div>
            <div className="text-[10px] text-gray-500">Super Admin</div>
          </div>
          <button onClick={() => logout()} className="text-gray-500 hover:text-gray-300">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <h2 className="text-base font-semibold">Platform Dashboard</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-gray-500">All Systems Operational</span>
            </div>
            <Link href="/super-admin/tenants/new"
              className="ml-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700">
              + Onboard Tenant
            </Link>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
