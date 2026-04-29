'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, isClinical, isTenantAdmin, isPlatformRole } from '@/lib/auth-store';
import AdminLayout from '@/components/layouts/admin-layout';

export default function ClinicalRootLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, fetchUser } = useAuthStore();
  const router = useRouter();
  useEffect(() => { fetchUser(); }, [fetchUser]);
  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (user && !isClinical(user.role) && !isTenantAdmin(user.role) && !isPlatformRole(user.role)) router.push('/login');
  }, [user, isLoading, router]);
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full" /></div>;
  if (!user) return null;
  return <AdminLayout>{children}</AdminLayout>;
}
