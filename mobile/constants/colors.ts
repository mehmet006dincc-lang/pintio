import Constants from 'expo-constants';

export const Colors = {
  primary: '#6B4EFF',
  primaryDark: '#5538EE',
  primaryLight: '#EDE9FF',
  background: '#F8F7FC',
  white: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E3F0',
  success: '#10B981',
  danger: '#EF4444',
  yellow: '#FBBF24',
  yellowBg: '#FEF3C7',
};

export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:3000';
