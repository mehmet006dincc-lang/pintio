import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Product } from '../services/api';
import { STORE_LABELS, StoreSlug } from '../constants/stores';

interface Props {
  product: Product;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPress?: () => void;
}

export function ProductCard({ product, isFavorite, onToggleFavorite, onPress }: Props) {
  const formatPrice = (price?: number | null) =>
    price ? `${price.toLocaleString('tr-TR')} TL` : '—';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
          </View>
        )}
        {product.discountPct && product.discountPct >= 10 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>%{product.discountPct}</Text>
            <Text style={styles.discountSub}>İNDİRİM</Text>
          </View>
        ) : null}
        {product.is6mLow ? (
          <View style={styles.lowBadge}>
            <Text style={styles.lowText}>6 Ayın En Düşüğü</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            {product.storeLabel || product.store ? (
              <View style={styles.storeBadge}>
                <Text style={styles.storeBadgeText}>
                  {product.storeLabel || STORE_LABELS[(product.store as StoreSlug) || 'trendyol']}
                </Text>
              </View>
            ) : null}
            {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
          </View>
          {onToggleFavorite ? (
            <TouchableOpacity onPress={onToggleFavorite} hitSlop={8}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>{product.title}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>{formatPrice(product.currentPrice)}</Text>
          {product.originalPrice && product.originalPrice > (product.currentPrice ?? 0) ? (
            <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.storeBtn}
          onPress={() => Linking.openURL(product.productUrl)}
        >
          <Text style={styles.storeBtnText}>Mağazaya Git</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: { position: 'relative' },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.danger,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
  },
  discountText: { color: Colors.white, fontSize: 12, fontWeight: '800' },
  discountSub: { color: Colors.white, fontSize: 8, fontWeight: '600' },
  lowBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 2,
  },
  lowText: { color: Colors.white, fontSize: 8, textAlign: 'center', fontWeight: '600' },
  content: { flex: 1, marginLeft: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flex: 1, gap: 4 },
  storeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  storeBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  brand: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  title: { fontSize: 14, color: Colors.text, fontWeight: '600', marginTop: 4, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  currentPrice: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  originalPrice: {
    fontSize: 13,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  storeBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  storeBtnText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
});
