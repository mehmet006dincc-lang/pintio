import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { usersApi } from '../../services/api';
import { registerForPushNotifications } from '../../services/pushNotifications';
import { Colors } from '../../constants/colors';

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined
  );
}

const SETTINGS = [
  {
    key: 'deals',
    title: 'İndirim Bildirimleri',
    desc: 'Gerçek indirime giren ürünler tüm kullanıcılara duyurulur; kapattığında sana gitmez',
  },
  {
    key: 'favorites',
    title: 'Favori Ürün Bildirimleri',
    desc: 'Favorilerindeki ürünlerin fiyatı düştüğünde bildir',
  },
  {
    key: 'flash',
    title: 'Flaş İndirimler',
    desc: 'Trendyol flaş indirimlerinden anlık haberdar ol',
  },
];

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    deals: true,
    favorites: true,
    flash: true,
  });
  const [loading, setLoading] = useState(true);
  const [pushActive, setPushActive] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const projectId = getProjectId();
  const needsExpoSetup = !projectId;

  const load = useCallback(async () => {
    try {
      const { data } = await usersApi.me();
      setSettings({
        deals: data.notificationSettings?.deals ?? true,
        favorites: data.notificationSettings?.favorites ?? true,
        flash: data.notificationSettings?.flash ?? true,
      });
      setPushActive(!!data.hasPushToken);
    } catch {
      Alert.alert('Hata', 'Ayarlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const enablePush = async () => {
    setPushLoading(true);
    const { token, error } = await registerForPushNotifications({ showAlertOnError: true });
    setPushActive(!!token);
    setPushLoading(false);
    if (token) {
      Alert.alert('Başarılı', 'Telefon bildirimleri etkinleştirildi.');
    } else if (error) {
      console.warn('[Push]', error);
    }
  };

  const toggle = async (key: string, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      await usersApi.updateNotificationSettings({ [key]: value });
    } catch {
      setSettings(settings);
      Alert.alert('Hata', 'Ayar kaydedilemedi');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.pushCard}>
        <View style={styles.pushHeader}>
          <Ionicons
            name={pushActive ? 'notifications' : 'notifications-off-outline'}
            size={24}
            color={pushActive ? Colors.primary : Colors.textMuted}
          />
          <View style={styles.pushText}>
            <Text style={styles.pushTitle}>Telefon Bildirimleri</Text>
            <Text style={styles.pushDesc}>
              {pushActive
                ? 'Push bildirimleri aktif'
                : needsExpoSetup
                  ? 'Expo kurulumu eksik — aşağıdaki adımları uygula'
                  : 'Henüz etkin değil — butona bas ve izin ver'}
            </Text>
          </View>
        </View>

        {needsExpoSetup ? (
          <View style={styles.setupBox}>
            <Text style={styles.setupStep}>1. cd mobile</Text>
            <Text style={styles.setupStep}>2. npx expo login</Text>
            <Text style={styles.setupStep}>3. npm run eas:init</Text>
            <Text style={styles.setupStep}>4. npx expo start --clear</Text>
          </View>
        ) : null}

        {!pushActive ? (
          <TouchableOpacity
            style={[styles.pushBtn, needsExpoSetup && styles.pushBtnDisabled]}
            onPress={enablePush}
            disabled={pushLoading || needsExpoSetup}
          >
            {pushLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.pushBtnText}>Push Bildirimlerini Aç</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.desc}>
        Hangi bildirimleri almak istediğini buradan yönetebilirsin.
      </Text>

      {SETTINGS.map((item) => (
        <View key={item.key} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowDesc}>{item.desc}</Text>
          </View>
          <Switch
            value={settings[item.key] ?? false}
            onValueChange={(v) => toggle(item.key, v)}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={settings[item.key] ? Colors.primary : Colors.textMuted}
          />
        </View>
      ))}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Push çalışmıyorsa: fiziksel telefon kullan, bildirim izni ver, terminalde{' '}
          <Text style={styles.noteBold}>npm run login</Text> ve{' '}
          <Text style={styles.noteBold}>npm run eas:init</Text> çalıştır, uygulamayı yeniden başlat.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pushCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pushHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pushText: { flex: 1 },
  pushTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  pushDesc: { fontSize: 13, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
  pushBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  pushBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  pushBtnDisabled: { opacity: 0.45 },
  setupBox: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  setupStep: { fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: Colors.text, marginBottom: 4 },
  desc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowText: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  rowDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 4, lineHeight: 16 },
  note: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  noteText: { fontSize: 13, color: Colors.primary, lineHeight: 18 },
  noteBold: { fontWeight: '700' },
});
