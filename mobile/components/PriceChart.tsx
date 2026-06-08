import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Colors } from '../constants/colors';
import { PriceHistory } from '../services/api';

const { width } = Dimensions.get('window');

interface Props {
  data: PriceHistory;
}

export function PriceChart({ data }: Props) {
  const chartData = data.history.map((h, i) => ({
    value: h.price,
    label: i % Math.ceil(data.history.length / 5) === 0
      ? new Date(h.recordedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
      : '',
  }));

  if (chartData.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Fiyat geçmişi henüz yeterli değil</Text>
        <Text style={styles.emptySub}>Veriler biriktikçe grafik görünecek</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fiyat Geçmişi (6 Ay)</Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>En Düşük</Text>
          <Text style={styles.statValue}>{data.min?.toLocaleString('tr-TR')} TL</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Ortalama</Text>
          <Text style={styles.statValue}>{data.avg?.toLocaleString('tr-TR')} TL</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>En Yüksek</Text>
          <Text style={styles.statValue}>{data.max?.toLocaleString('tr-TR')} TL</Text>
        </View>
      </View>

      <LineChart
        data={chartData}
        width={width - 64}
        height={180}
        color={Colors.primary}
        thickness={2}
        hideDataPoints={chartData.length > 30}
        dataPointsColor={Colors.primary}
        startFillColor={Colors.primaryLight}
        endFillColor={Colors.white}
        startOpacity={0.4}
        endOpacity={0.05}
        areaChart
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        noOfSections={4}
        curved
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  stat: { alignItems: 'center' },
  statLabel: { fontSize: 11, color: Colors.textMuted },
  statValue: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  axisText: { fontSize: 10, color: Colors.textMuted },
  empty: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  emptySub: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});
