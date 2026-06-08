import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '../services/pushNotifications';
import { useAuthStore } from '../store/authStore';

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setTimeout(() => {
      registerForPushNotifications();
    }, 1500);

    const received = Notifications.addNotificationReceivedListener(() => {});

    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      const productId = event.notification.request.content.data?.productId;
      if (typeof productId === 'string' && productId) {
        router.push(`/product/${productId}`);
      } else {
        router.push('/(tabs)/notifications');
      }
    });

    return () => {
      clearTimeout(timer);
      received.remove();
      response.remove();
    };
  }, [isAuthenticated]);
}
