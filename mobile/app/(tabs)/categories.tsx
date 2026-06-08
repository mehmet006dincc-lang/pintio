import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { categoriesApi, Category, Product } from '../../services/api';
import { ProductCard } from '../../components/ProductCard';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  moda: 'shirt',
  elektronik: 'laptop-outline',
  'ev-yasam': 'home-outline',
  kozmetik: 'sparkles-outline',
  oyun: 'game-controller-outline',
};

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await categoriesApi.list();
    setCategories(data.filter((c) => c.slug !== 'all'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCategory = async (cat: Category) => {
    setSelected(cat);
    const { data } = await categoriesApi.products(cat.slug);
    setProducts(data);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{selected ? selected.name : 'Kategoriler'}</Text>
        {selected ? (
          <TouchableOpacity onPress={() => { setSelected(null); setProducts([]); }}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        {!selected ? (
          <View style={styles.grid}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.slug} style={styles.gridItem} onPress={() => openCategory(cat)}>
                <View style={styles.iconWrap}>
                  <Ionicons name={ICON_MAP[cat.slug] ?? 'grid-outline'} size={28} color={Colors.primary} />
                </View>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catCount}>{cat.productCount} indirim</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : products.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Bu kategoride henüz indirim yok</Text>
            <Text style={styles.emptySub}>Kriterlere uyan ürünler burada listelenir</Text>
          </View>
        ) : (
          products.map((p) => (
            <ProductCard key={p.id} product={p} onPress={() => router.push(`/product/${p.id}`)} />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  gridItem: {
    width: '30%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 8, textAlign: 'center' },
  catCount: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  emptySub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
});
