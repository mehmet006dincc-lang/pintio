import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { bannersApi, categoriesApi, productsApi, Product, Banner, Category } from '../../services/api';
import { SponsorBanner } from '../../components/SponsorBanner';
import { CategoryScroll } from '../../components/CategoryScroll';
import { ProductCard } from '../../components/ProductCard';

export default function HomeScreen() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [bannersRes, catsRes, dealsRes] = await Promise.all([
        bannersApi.list(),
        categoriesApi.list(),
        productsApi.featured(30),
      ]);
      setBanners(bannersRes.data);
      setCategories(catsRes.data);
      setDeals(dealsRes.data);
    } catch (e) {
      console.warn('Home load error', e);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      await load();
      return;
    }
    try {
      const { data } = await productsApi.search(search.trim());
      setDeals(data);
    } catch (e) {
      console.warn('Search error', e);
    }
  };

  const handleCategory = async (slug: string) => {
    setSelectedCategory(slug);
    try {
      const { data } = slug === 'all'
        ? await productsApi.featured(30)
        : await categoriesApi.products(slug);
      setDeals(data);
    } catch (e) {
      console.warn('Category error', e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <View style={styles.logoRow}>
              <Ionicons name="pricetag" size={24} color={Colors.primary} />
              <Text style={styles.appName}>Pintio</Text>
            </View>
            <Text style={styles.tagline}>İndirimi yakala, kazan!</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')}>
            <Ionicons name="notifications-outline" size={26} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="İndirim ara..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity style={styles.trackLink} onPress={() => router.push('/profile/track')}>
          <Ionicons name="link-outline" size={18} color={Colors.primary} />
          <Text style={styles.trackLinkText}>Trendyol linki ile ürün takip et</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <SponsorBanner banners={banners} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
        </View>
        <CategoryScroll categories={categories} selected={selectedCategory} onSelect={handleCategory} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gerçek İndirimler</Text>
        </View>

        {deals.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pricetags-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Henüz paylaşılacak indirim yok</Text>
            <Text style={styles.emptySub}>
              Ürünler arka planda izleniyor. 6 ayın en düşük fiyatına düşen veya %15+ indirime giren ürünler burada görünür.
            </Text>
          </View>
        ) : (
          deals.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appName: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  tagline: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: Colors.text },
  trackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    gap: 8,
  },
  trackLinkText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.primary },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
});
