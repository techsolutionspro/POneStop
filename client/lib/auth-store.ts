import { create } from 'zustand';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    status: string;
    tier: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  staffProfile?: any;
  mfaEnabled: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    set({ user: data.data.user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchUser: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const { data } = await authApi.me();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));

// Role helpers
export function isPlatformRole(role: string) {
  return ['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(role);
}

export function isTenantAdmin(role: string) {
  return ['TENANT_OWNER', 'BRANCH_MANAGER'].includes(role);
}

export function isClinical(role: string) {
  return ['PHARMACIST', 'PRESCRIBER'].includes(role);
}

export function isOperations(role: string) {
  return ['DISPENSER', 'DISPATCH_CLERK', 'RECEPTIONIST'].includes(role);
}

export function getDefaultRoute(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'SUPPORT_AGENT':
      return '/super-admin';
    case 'TENANT_OWNER':
    case 'BRANCH_MANAGER':
      return '/admin';
    case 'PHARMACIST':
    case 'PRESCRIBER':
      return '/clinical';
    case 'DISPENSER':
    case 'DISPATCH_CLERK':
      return '/admin/orders';
    case 'RECEPTIONIST':
      return '/admin/bookings';
    case 'PATIENT':
      return '/account';
    default:
      return '/';
  }
}
