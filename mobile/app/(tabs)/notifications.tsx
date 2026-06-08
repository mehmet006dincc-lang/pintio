import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { notificationsApi, NotificationItem } from '../../services/api';

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await notificationsApi.list();
      setItems(data);
    } catch (e) {
      console.warn('Notifications load error', e);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const openNotification = async (item: NotificationItem) => {
    if (!item.isRead) {
      await notificationsApi.markRead(item.id);
      setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, isRead: true } : n));
    }
    if (item.productId) {
      router.push(`/product/${item.productId}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Bildirimler</Text>
        {items.some((n) => !n.isRead) ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Tümünü oku</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={Colors.primary} />}
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Henüz bildirim yok</Text>
            <Text style={styles.emptySub}>Favori ürünlerinde fiyat düşünce burada görünecek</Text>
          </View>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.item, !item.isRead && styles.itemUnread]}
              onPress={() => openNotification(item)}
            >
              <View style={[styles.iconWrap, item.type === 'price_drop' && styles.iconDeal]}>
                <Ionicons
                  name={item.type === 'price_drop' ? 'trending-down' : 'notifications'}
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.itemTime}>
                  {new Date(item.createdAt).toLocaleString('tr-TR')}
                </Text>
              </View>
              {!item.isRead ? <View style={styles.unreadDot} /> : null}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  markAll: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
  },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDeal: { backgroundColor: '#FEE2E2' },
  itemContent: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  itemBody: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  itemTime: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
});
