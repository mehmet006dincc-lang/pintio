import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

interface User {
  id: string;
  email: string | null;
  name: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<boolean>;
}

const TOKEN_KEY = 'accessToken';

async function saveToken(token: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function getToken() {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function removeToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: saveToken,

  logout: async () => {
    await removeToken();
    set({ user: null, isAuthenticated: false });
  },

  loadToken: async () => {
    set({ isLoading: true });
    try {
      const token = await getToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return false;
      }
      set({ isLoading: false, isAuthenticated: true });
      return true;
    } catch {
      set({ isLoading: false, isAuthenticated: false });
      return false;
    }
  },
}));
