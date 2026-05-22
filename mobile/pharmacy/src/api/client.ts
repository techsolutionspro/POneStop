import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync('accessToken', data.data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const dashboardApi = {
  tenant: () => api.get('/dashboard/tenant'),
};

export const orderApi = {
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  queue: () => api.get('/orders/queue'),
  review: (id: string, data: any) => api.post(`/orders/${id}/review`, data),
  dispatch: (id: string, data: any) => api.post(`/orders/${id}/dispatch`, data),
};

export const earningsApi = {
  summary: () => api.get('/earnings'),
  history: (params?: any) => api.get('/earnings/history', { params }),
};

export const payoutApi = {
  request: (data: any) => api.post('/payouts/request', data),
  list: (params?: any) => api.get('/payouts', { params }),
  stats: () => api.get('/payouts/stats'),
};

export const serviceApi = {
  list: (params?: any) => api.get('/services', { params }),
  get: (id: string) => api.get(`/services/${id}`),
  update: (id: string, data: any) => api.put(`/services/${id}`, data),
};
