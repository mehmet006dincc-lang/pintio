import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categoriesApi, usersApi, Category } from '../../services/api';
import { Colors } from '../../constants/colors';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  moda: 'shirt-outline',
  elektronik: 'laptop-outline',
  'ev-yasam': 'home-outline',
  kozmetik: 'sparkles-outline',
  oyun: 'game-controller-outline',
};

export default function InterestsScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [catsRes, profileRes] = await Promise.all([
        categoriesApi.list(),
        usersApi.me(),
      ]);
      setCategories(catsRes.data.filter((c) => c.slug !== 'all'));
      setSelected(profileRes.data.interests ?? []);
    } catch {
      Alert.alert('Hata', 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersApi.update({ interests: selected });
      Alert.alert('Başarılı', 'İlgi alanların kaydedildi');
    } catch {
      Alert.alert('Hata', 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.desc}>
        Seçtiğin kategorilerdeki indirimlerden öncelikli bildirim alırsın.
      </Text>

      {categories.map((cat) => {
        const isSelected = selected.includes(cat.slug);
        return (
          <TouchableOpacity
            key={cat.slug}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => toggle(cat.slug)}
          >
            <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
              <Ionicons
                name={ICON_MAP[cat.slug] ?? 'grid-outline'}
                size={24}
                color={isSelected ? Colors.primary : Colors.textSecondary}
              />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                {cat.name}
              </Text>
              <Text style={styles.cardSub}>{cat.productCount} indirim</Text>
            </View>
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={24}
              color={isSelected ? Colors.primary : Colors.textMuted}
            />
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>Kaydet</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  desc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: Colors.white },
  cardText: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  cardTitleSelected: { color: Colors.primary },
  cardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
