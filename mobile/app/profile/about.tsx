import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.logoWrap}>
        <Ionicons name="pricetag" size={48} color={Colors.primary} />
        <Text style={styles.appName}>Pintio</Text>
        <Text style={styles.tagline}>İndirimi yakala, kazan!</Text>
        <Text style={styles.version}>Sürüm 1.0.0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Biz Kimiz?</Text>
        <Text style={styles.cardText}>
          Pintio, Trendyol, Hepsiburada, N11 ve diğer e-ticaret platformlarındaki ürünlerin
          fiyatlarını takip eden bir indirim izleme uygulamasıdır. Satış yapmıyoruz; sizi en
          uygun fiyata yönlendiriyoruz.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nasıl Çalışır?</Text>
        <Text style={styles.cardText}>
          • Ürün fiyatlarını sürekli izleriz{'\n'}
          • Son 6 ayın en düşük fiyatını hesaplarız{'\n'}
          • Gerçek indirimleri filtreleriz{'\n'}
          • Fiyat düştüğünde anında bildiririz
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Yasal</Text>
        <Text style={styles.cardText}>
          Pintio bir fiyat karşılaştırma ve takip aracıdır. Üçüncü taraf satıcı sitelerine
          yönlendirme bağlantıları içerir. KVKK kapsamında kişisel verileriniz yalnızca hizmet
          sunumu için işlenir.
        </Text>
      </View>

      <Text style={styles.copyright}>© 2026 Pintio. Tüm hakları saklıdır.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  logoWrap: { alignItems: 'center', paddingVertical: 24 },
  appName: { fontSize: 24, fontWeight: '800', color: Colors.primary, marginTop: 8 },
  tagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  version: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  cardText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  copyright: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 16 },
});
