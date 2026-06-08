import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { productsApi, favoritesApi, Product, PriceHistory } from '../../services/api';
import { PriceChart } from '../../components/PriceChart';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [productRes, historyRes] = await Promise.all([
        productsApi.getOne(id),
        productsApi.priceHistory(id),
      ]);
      setProduct(productRes.data);
      setHistory(historyRes.data);
    } catch (e) {
      console.warn('Product load error', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggleFavorite = async () => {
    if (!product) return;
    try {
      if (isFavorite) {
        await favoritesApi.remove(product.id);
        setIsFavorite(false);
      } else {
        await favoritesApi.add(product.id);
        setIsFavorite(true);
        Alert.alert('Favorilere eklendi', 'Fiyat düştüğünde bildirim alacaksın.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Favori işlemi başarısız');
    }
  };

  if (loading || !product) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const formatPrice = (p?: number | null) =>
    p ? `${p.toLocaleString('tr-TR')} TL` : '—';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Ürün Detay',
          headerTintColor: Colors.primary,
          headerBackTitleVisible: false,
          headerBackTitle: 'Geri',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={64} color={Colors.textMuted} />
            </View>
          )}
        </View>

        {product.storeLabel || product.store ? (
          <View style={styles.storeBadge}>
            <Text style={styles.storeBadgeText}>{product.storeLabel || product.store}</Text>
          </View>
        ) : null}
        {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
        <Text style={styles.title}>{product.title}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>{formatPrice(product.currentPrice)}</Text>
          {product.originalPrice && product.originalPrice > (product.currentPrice ?? 0) ? (
            <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
          ) : null}
        </View>

        <View style={styles.badges}>
          {product.is6mLow ? (
            <View style={styles.badge6m}>
              <Ionicons name="trending-down" size={14} color={Colors.white} />
              <Text style={styles.badge6mText}>Son 6 Ayın En Düşük Fiyatı</Text>
            </View>
          ) : null}
          {product.discountPct && product.discountPct >= 10 ? (
            <View style={styles.badgeDiscount}>
              <Text style={styles.badgeDiscountText}>%{product.discountPct} İndirim</Text>
            </View>
          ) : null}
        </View>

        {history ? <PriceChart data={history} /> : null}

        <TouchableOpacity style={styles.favBtn} onPress={toggleFavorite}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={Colors.primary} />
          <Text style={styles.favBtnText}>
            {isFavorite ? 'Favorilerden Çıkar' : 'Favoriye Ekle'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.storeBtn}
          onPress={() => Linking.openURL(product.productUrl)}
        >
          <Ionicons name="cart-outline" size={22} color={Colors.white} />
          <Text style={styles.storeBtnText}>Mağazaya Git</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageWrap: { alignItems: 'center', marginBottom: 16 },
  image: { width: '100%', height: 280, borderRadius: 16, backgroundColor: Colors.white },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  storeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  storeBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  brand: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 4, lineHeight: 26 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  currentPrice: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  originalPrice: { fontSize: 16, color: Colors.textMuted, textDecorationLine: 'line-through' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge6m: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badge6mText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  badgeDiscount: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeDiscountText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  favBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
  },
  favBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
  },
  storeBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
