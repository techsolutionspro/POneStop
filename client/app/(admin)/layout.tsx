'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, isTenantAdmin, isClinical, isOperations } from '@/lib/auth-store';
import AdminLayout from '@/components/layouts/admin-layout';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, fetchUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (user && !isTenantAdmin(user.role) && !isClinical(user.role) && !isOperations(user.role)) {
      router.push('/login');
    }
    // If tenant is still onboarding and user is not on the onboarding page, redirect there
    if (user?.tenant?.status === 'ONBOARDING' && pathname && !pathname.includes('/onboarding')) {
      router.push('/admin/onboarding');
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  // Show onboarding without the full admin sidebar
  if (user.tenant?.status === 'ONBOARDING') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
              {user.tenant.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{user.tenant.name}</div>
              <div className="text-xs text-gray-400">Setting up your pharmacy</div>
            </div>
          </div>
          <button onClick={() => useAuthStore.getState().logout().then(() => router.push('/login'))}
            className="text-sm text-gray-500 hover:text-gray-700">Sign Out</button>
        </header>
        <main>{children}</main>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
