import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const FAQ = [
  {
    q: 'Pintio nasıl çalışır?',
    a: 'Desteklenen mağazalardaki ürün fiyatlarını izler, gerçek indirime girdiğinde seni bildiririz. Satış yapmıyoruz; seni doğrudan mağazaya yönlendiriyoruz.',
  },
  {
    q: 'Favori ürün nasıl eklerim?',
    a: 'Ürün detay sayfasındaki kalp ikonuna veya listedeki favori butonuna basarak ekleyebilirsin.',
  },
  {
    q: 'Bildirimler ne zaman gelir?',
    a: 'Favorilediğin ürünlerde fiyat düştüğünde veya seçtiğin kategorilerde önemli indirimler olduğunda push bildirimi alırsın.',
  },
  {
    q: 'Fiyat grafiği ne anlama geliyor?',
    a: 'Son 6 aylık fiyat geçmişini gösterir. Böylece gerçekten indirimde mi yoksa sahte indirim mi anlayabilirsin.',
  },
];

export default function HelpScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Sık Sorulan Sorular</Text>
      {FAQ.map((item, i) => (
        <View key={i} style={styles.faqCard}>
          <Text style={styles.question}>{item.q}</Text>
          <Text style={styles.answer}>{item.a}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>İletişim</Text>
      <TouchableOpacity
        style={styles.contactRow}
        onPress={() => Linking.openURL('mailto:destek@pintio.app')}
      >
        <Ionicons name="mail-outline" size={22} color={Colors.primary} />
        <Text style={styles.contactText}>destek@pintio.app</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Sorunun devam ederse e-posta gönder; en geç 24 saat içinde dönüş yapılır.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 8 },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  question: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  answer: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  contactText: { flex: 1, fontSize: 15, color: Colors.primary, fontWeight: '500' },
  note: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  noteText: { fontSize: 13, color: Colors.primary, lineHeight: 18 },
});
