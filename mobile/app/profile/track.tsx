import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import {
  isValidProductUrl,
  SUPPORTED_STORES_TEXT,
  STORE_LABELS,
  StoreSlug,
} from '../../constants/stores';
import { productsApi, favoritesApi } from '../../services/api';

export default function TrackUrlScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setUrl(text.trim());
  };

  const handleTrack = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert('Hata', 'Ürün linkini yapıştır');
      return;
    }
    if (!isValidProductUrl(trimmed)) {
      Alert.alert(
        'Geçersiz link',
        `Desteklenen mağazalardan birinin ürün sayfası linki olmalı.\n\n${SUPPORTED_STORES_TEXT}`,
      );
      return;
    }

    setLoading(true);
    try {
      const { data: product } = await productsApi.trackUrl(trimmed);
      try {
        await favoritesApi.add(product.id);
      } catch {
        // Already favorited
      }
      Alert.alert(
        'Takibe alındı',
        'Ürün izleniyor. Gerçek indirime girdiğinde bildirim alacaksın.',
        [{ text: 'Tamam', onPress: () => router.push(`/product/${product.id}`) }],
      );
    } catch {
      Alert.alert('Hata', 'Ürün eklenemedi. Linki kontrol edip tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.iconWrap}>
          <Ionicons name="link" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>URL ile Ürün Takibi</Text>
        <Text style={styles.subtitle}>
          Desteklenen mağazalardan ürün linkini kopyala. Fiyat düştüğünde bildirim alırsın.
        </Text>

        <View style={styles.storesRow}>
          {(Object.keys(STORE_LABELS) as StoreSlug[]).map((store) => (
            <View key={store} style={styles.storeChip}>
              <Text style={styles.storeChipText}>{STORE_LABELS[store]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Ürün linkini yapıştır..."
            placeholderTextColor={Colors.textMuted}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />
          <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste}>
            <Ionicons name="clipboard-outline" size={18} color={Colors.primary} />
            <Text style={styles.pasteText}>Yapıştır</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={handleTrack}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={22} color={Colors.white} />
              <Text style={styles.submitText}>Takibe Al</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Nasıl çalışır?</Text>
          <Text style={styles.tipItem}>1. Mağaza uygulamasından veya tarayıcıdan ürün sayfasını aç</Text>
          <Text style={styles.tipItem}>2. Paylaş → Linki kopyala</Text>
          <Text style={styles.tipItem}>3. Buraya yapıştır ve Takibe Al</Text>
          <Text style={styles.tipNote}>
            Ürün 6 ayın en düşük fiyatına düşerse veya anlamlı indirime girerse uygulamada görünür ve bildirim gider.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, paddingBottom: 40 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 16,
  },
  storesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  storeChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  storeChipText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  inputWrap: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  input: {
    minHeight: 80,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pasteText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  tips: {
    marginTop: 32,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  tipItem: { fontSize: 14, color: Colors.textSecondary, marginBottom: 6 },
  tipNote: { fontSize: 13, color: Colors.textMuted, marginTop: 8, lineHeight: 18 },
});
