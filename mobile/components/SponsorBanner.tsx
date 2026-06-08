import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { Banner } from '../services/api';

const { width } = Dimensions.get('window');

interface Props {
  banners: Banner[];
}

export function SponsorBanner({ banners }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!banners.length) {
    return (
      <LinearGradient colors={['#6B4EFF', '#8B6FFF']} style={styles.fallback}>
        <Text style={styles.tag}>GÜNÜN FIRSATI</Text>
        <Text style={styles.title}>Seçili Ürünlerde İndirim!</Text>
      </LinearGradient>
    );
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
          setActiveIndex(index);
        }}
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            onPress={() => Linking.openURL(banner.linkUrl)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#6B4EFF', '#8B6FFF']}
              style={styles.banner}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.tag}>GÜNÜN FIRSATI</Text>
                <Text style={styles.title}>{banner.title ?? 'Sponsor Fırsat'}</Text>
                {banner.subtitle ? (
                  <Text style={styles.subtitle}>{banner.subtitle}</Text>
                ) : null}
              </View>
              {banner.imageUrl ? (
                <Image source={{ uri: banner.imageUrl }} style={styles.bannerImage} />
              ) : null}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {banners.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: width - 32,
    height: 160,
    marginHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 16,
  },
  fallback: {
    marginHorizontal: 16,
    height: 120,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
  },
  bannerContent: { flex: 1, justifyContent: 'center' },
  tag: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: { color: Colors.white, fontSize: 18, fontWeight: '800', marginTop: 4 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  bannerImage: { width: 100, height: 100, borderRadius: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 18 },
});
