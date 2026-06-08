import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/colors';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

async function getStoredToken() {
  if (Platform.OS === 'web') {
    return localStorage.getItem('accessToken');
  }
  return SecureStore.getItemAsync('accessToken');
}

api.interceptors.request.use(async (config) => {
  // ngrok ücretsiz planda mobil istekler için gerekli
  if (config.baseURL?.includes('ngrok')) {
    config.headers['ngrok-skip-browser-warning'] = 'true';
  }
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Product {
  id: string;
  store?: string;
  storeLabel?: string;
  title: string;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  productUrl: string;
  currentPrice?: number | null;
  originalPrice?: number | null;
  discountPct?: number | null;
  is6mLow?: boolean;
  isFlash?: boolean;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
  linkUrl: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon?: string | null;
  productCount: number;
}

export interface PriceHistory {
  productId: string;
  days: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  current: number | null;
  history: { price: number; recordedAt: string; inStock: boolean }[];
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  productId?: string | null;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  oauth: (data: { provider: 'apple' | 'google'; providerId: string; name: string; email?: string }) =>
    api.post('/api/auth/oauth', data),
};

export const productsApi = {
  featured: (limit = 20) => api.get<Product[]>('/api/products/featured', { params: { limit } }),
  flash: (limit = 20) => api.get<Product[]>('/api/products/flash', { params: { limit } }),
  search: (q: string) => api.get<Product[]>('/api/products/search', { params: { q } }),
  getOne: (id: string) => api.get<Product>(`/api/products/${id}`),
  priceHistory: (id: string) => api.get<PriceHistory>(`/api/products/${id}/price-history`),
  trackUrl: (url: string) => api.post<Product>('/api/products/track-url', { url }),
};

export const categoriesApi = {
  list: () => api.get<Category[]>('/api/categories'),
  products: (slug: string) => api.get<Product[]>(`/api/categories/${slug}/products`),
};

export const favoritesApi = {
  list: () => api.get<Product[]>('/api/favorites'),
  add: (productId: string) => api.post(`/api/favorites/${productId}`),
  remove: (productId: string) => api.delete(`/api/favorites/${productId}`),
};

export const bannersApi = {
  list: () => api.get<Banner[]>('/api/banners'),
};

export const notificationsApi = {
  list: () => api.get<NotificationItem[]>('/api/notifications'),
  unreadCount: () => api.get<number>('/api/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch('/api/notifications/read-all'),
};

export interface UserProfile {
  id: string;
  email: string | null;
  name: string;
  interests: string[];
  notificationSettings: Record<string, boolean>;
  hasPushToken?: boolean;
}

export const usersApi = {
  me: () => api.get<UserProfile>('/api/users/me'),
  update: (data: { name?: string; interests?: string[] }) => api.patch<UserProfile>('/api/users/me', data),
  deleteAccount: () => api.delete('/api/users/me'),
  updatePushToken: (token: string) => api.patch('/api/users/push-token', { token }),
  updateNotificationSettings: (settings: Record<string, boolean>) =>
    api.patch<Record<string, boolean>>('/api/users/notification-settings', settings),
};

export default api;
