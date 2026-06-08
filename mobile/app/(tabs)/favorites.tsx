import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { favoritesApi, Product } from '../../services/api';
import { ProductCard } from '../../components/ProductCard';

export default function FavoritesScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await favoritesApi.list();
      setProducts(data);
    } catch (e) {
      console.warn('Favorites load error', e);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleFavorite = async (productId: string) => {
    await favoritesApi.remove(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorilerim</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={Colors.primary} />}
      >
        {products.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Henüz favori ürünün yok</Text>
            <Text style={styles.emptySub}>Beğendiğin ürünleri favorilere ekleyerek fiyat düşüşlerinden haberdar ol</Text>
          </View>
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite
              onToggleFavorite={() => toggleFavorite(product.id)}
              onPress={() => router.push(`/product/${product.id}`)}
            />
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
});
