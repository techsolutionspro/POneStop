import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ============================================================
// API FUNCTIONS
// ============================================================

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
  signup: (data: any) => api.post('/auth/signup', data),
  createPlatformUser: (data: any) => api.post('/auth/platform-user', data),
};

// Tenants
export const tenantApi = {
  list: (params?: any) => api.get('/tenants', { params }),
  get: (id: string) => api.get(`/tenants/${id}`),
  create: (data: any) => api.post('/tenants', data),
  update: (id: string, data: any) => api.put(`/tenants/${id}`, data),
  updateStatus: (id: string, status: string) => api.put(`/tenants/${id}/status`, { status }),
  updateTier: (id: string, tier: string) => api.put(`/tenants/${id}/tier`, { tier }),
  goLive: (id: string) => api.post(`/tenants/${id}/go-live`),
  updateDsp: (id: string, data: any) => api.put(`/tenants/${id}/dsp`, data),
  listBranches: (tenantId: string) => api.get(`/tenants/${tenantId}/branches`),
  createBranch: (tenantId: string, data: any) => api.post(`/tenants/${tenantId}/branches`, data),
  updateBranch: (tenantId: string, branchId: string, data: any) => api.put(`/tenants/${tenantId}/branches/${branchId}`, data),
};

// Staff
export const staffApi = {
  list: (params?: any) => api.get('/staff', { params }),
  get: (id: string) => api.get(`/staff/${id}`),
  invite: (data: any) => api.post('/staff/invite', data),
  update: (id: string, data: any) => api.put(`/staff/${id}`, data),
  deactivate: (id: string) => api.delete(`/staff/${id}`),
  platformUsers: (params?: any) => api.get('/staff/platform/users', { params }),
};

// Services
export const serviceApi = {
  list: (params?: any) => api.get('/services', { params }),
  get: (id: string) => api.get(`/services/${id}`),
  create: (data: any) => api.post('/services', data),
  update: (id: string, data: any) => api.put(`/services/${id}`, data),
  storefront: (slug: string) => api.get(`/services/storefront/${slug}`),
};

// Bookings
export const bookingApi = {
  list: (params?: any) => api.get('/bookings', { params }),
  get: (id: string) => api.get(`/bookings/${id}`),
  create: (data: any) => api.post('/bookings', data),
  updateStatus: (id: string, status: string, reason?: string) =>
    api.put(`/bookings/${id}/status`, { status, cancellationReason: reason }),
  today: () => api.get('/bookings/today/list'),
};

// Orders
export const orderApi = {
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  queue: () => api.get('/orders/queue'),
  review: (id: string, data: any) => api.post(`/orders/${id}/review`, data),
  dispatch: (id: string, data: any) => api.post(`/orders/${id}/dispatch`, data),
  track: (reference: string) => api.get(`/orders/track/${reference}`),
};

// PGDs
export const pgdApi = {
  list: (params?: any) => api.get('/pgds', { params }),
  get: (id: string) => api.get(`/pgds/${id}`),
  create: (data: any) => api.post('/pgds', data),
  update: (id: string, data: any) => api.put(`/pgds/${id}`, data),
  publish: (id: string) => api.post(`/pgds/${id}/publish`),
  therapyAreas: () => api.get('/pgds/meta/therapy-areas'),
};

// Patients
export const patientApi = {
  list: (params?: any) => api.get('/patients', { params }),
  get: (id: string) => api.get(`/patients/${id}`),
  update: (id: string, data: any) => api.put(`/patients/${id}`, data),
  recordIdv: (id: string, data: any) => api.post(`/patients/${id}/idv`, data),
  myProfile: () => api.get('/patients/me/profile'),
};

// Dashboard
export const dashboardApi = {
  tenant: () => api.get('/dashboard/tenant'),
  platform: () => api.get('/dashboard/platform'),
};

// Audit
export const auditApi = {
  list: (params?: any) => api.get('/audit', { params }),
  stats: () => api.get('/audit/stats'),
};

// Packages (public + admin)
export const packageApi = {
  list: () => api.get('/packages'),
  listAll: () => api.get('/packages/all'),
  create: (data: any) => api.post('/packages', data),
  update: (id: string, data: any) => api.put(`/packages/${id}`, data),
  delete: (id: string) => api.delete(`/packages/${id}`),
};
