import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Category } from '../services/api';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  all: 'pricetag',
  moda: 'shirt',
  elektronik: 'laptop-outline',
  'ev-yasam': 'home-outline',
  kozmetik: 'sparkles-outline',
  oyun: 'game-controller-outline',
};

interface Props {
  categories: Category[];
  selected: string;
  onSelect: (slug: string) => void;
}

export function CategoryScroll({ categories, selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const isActive = selected === cat.slug;
        return (
          <TouchableOpacity
            key={cat.slug}
            style={[styles.item, isActive && styles.itemActive]}
            onPress={() => onSelect(cat.slug)}
          >
            <Ionicons
              name={ICON_MAP[cat.slug] ?? 'grid-outline'}
              size={22}
              color={isActive ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{cat.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 10, paddingVertical: 8 },
  item: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 72,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  label: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' },
  labelActive: { color: Colors.primary },
});
