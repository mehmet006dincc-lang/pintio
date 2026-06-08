import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { usersApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const MENU_ITEMS = [
  { icon: 'person-outline' as const, label: 'Profil Bilgilerim', href: '/profile/info' },
  { icon: 'link-outline' as const, label: 'URL ile Takip', href: '/profile/track' },
  { icon: 'heart-outline' as const, label: 'İlgi Alanlarım', href: '/profile/interests' },
  { icon: 'notifications-outline' as const, label: 'Bildirim Ayarları', href: '/profile/notifications' },
  { icon: 'help-circle-outline' as const, label: 'Yardım & Destek', href: '/profile/help' },
  { icon: 'information-circle-outline' as const, label: 'Hakkımızda', href: '/profile/about' },
];

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuthStore();
  const [profile, setProfile] = useState<{ name: string; email: string | null } | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await usersApi.me();
      setProfile(data);
      setUser(data);
    } catch (e) {
      console.warn('Profile load error', e);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkış yapmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabın kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await usersApi.deleteAccount();
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  const displayName = profile?.name ?? user?.name ?? 'Kullanıcı';
  const displayEmail = profile?.email ?? user?.email ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#6B4EFF', '#8B6FFF']} style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.greeting}>Merhaba, {displayName.split(' ')[0]}!</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </LinearGradient>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => router.push(item.href as '/profile/info')}
            >
              <Ionicons name={item.icon} size={22} color={Colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
            <Text style={[styles.menuLabel, { color: Colors.danger }]}>Çıkış Yap</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={22} color={Colors.danger} />
            <Text style={[styles.menuLabel, { color: Colors.danger }]}>Hesabımı Sil</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Pintio v1.0.0</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.white },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.white, marginTop: 12 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  menu: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuLabel: { flex: 1, marginLeft: 12, fontSize: 15, color: Colors.text, fontWeight: '500' },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: 24 },
});
