import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../services/api';
import { registerForPushNotifications } from '../services/pushNotifications';
import { Colors } from '../constants/colors';

export default function Index() {
  const { isLoading, isAuthenticated, loadToken, setUser } = useAuthStore();

  useEffect(() => {
    (async () => {
      const hasToken = await loadToken();
      if (hasToken) {
        try {
          const { data } = await usersApi.me();
          setUser(data);
          registerForPushNotifications();
        } catch {
          await useAuthStore.getState().logout();
        }
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
