import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { usersApi } from './api';

export type PushRegisterResult = {
  token: string | null;
  error: string | null;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('deals', {
    name: 'İndirim Bildirimleri',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

function resolveProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    undefined
  );
}

async function saveTokenWithRetry(token: string, attempts = 3): Promise<void> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      await usersApi.updatePushToken(token);
      return;
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw lastError;
}

export async function registerForPushNotifications(
  options: { showAlertOnError?: boolean } = {},
): Promise<PushRegisterResult> {
  const { showAlertOnError = false } = options;

  if (Platform.OS === 'web') {
    return { token: null, error: 'Web push desteklenmiyor' };
  }

  if (!Device.isDevice) {
    const error = 'Push bildirimleri fiziksel telefonda çalışır (simülatörde değil)';
    if (showAlertOnError) Alert.alert('Push', error);
    return { token: null, error };
  }

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    const error = 'Bildirim izni verilmedi. Ayarlar → Pintio → Bildirimler';
    if (showAlertOnError) Alert.alert('Push', error);
    return { token: null, error };
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    const error =
      'Expo project ID bulunamadı. Terminalde:\ncd mobile\nnpx expo login\nnpx eas init\nSonra uygulamayı yeniden başlat.';
    console.warn('[Push]', error);
    if (showAlertOnError) Alert.alert('Push kurulumu gerekli', error);
    return { token: null, error };
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    await saveTokenWithRetry(token);
    console.log('[Push] Token kaydedildi:', token.slice(0, 30) + '…');
    return { token, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Push token alınamadı';
    console.warn('[Push] Kayıt hatası:', message);
    if (showAlertOnError) Alert.alert('Push hatası', message);
    return { token: null, error: message };
  }
}
