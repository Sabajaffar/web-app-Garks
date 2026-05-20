import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { TrendingUp, Users, ShoppingBag, Activity, RefreshCcw, BrainCircuit, Zap } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;

const CHART_CONFIG = {
  backgroundColor: COLORS.card,
  backgroundGradientFrom: COLORS.card,
  backgroundGradientTo: COLORS.card,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(201, 169, 110, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(139, 156, 200, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#C9A96E' },
};

const SALE_DATA = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [{ data: [4000, 3000, 5000, 2780, 6890, 8900, 7200], color: () => COLORS.secondary, strokeWidth: 2 }],
};

const PEAK_DATA = {
  labels: ['08', '10', '12', '14', '16', '18', '20', '22'],
  datasets: [{ data: [120, 450, 890, 670, 540, 1200, 980, 400] }],
};

const PIE_DATA = [
  { name: 'Men', population: 45, color: '#C9A96E', legendFontColor: COLORS.muted, legendFontSize: 11 },
  { name: 'Women', population: 35, color: '#F5E6D3', legendFontColor: COLORS.muted, legendFontSize: 11 },
  { name: 'Kids', population: 15, color: '#253875', legendFontColor: COLORS.muted, legendFontSize: 11 },
  { name: 'Luxury', population: 5, color: '#8B9CC8', legendFontColor: COLORS.muted, legendFontSize: 11 },
];

const TOP_CITIES = [
  { city: 'Karachi', rate: '42%', bar: 0.42 },
  { city: 'Lahore', rate: '28%', bar: 0.28 },
  { city: 'Islamabad', rate: '15%', bar: 0.15 },
  { city: 'Faisalabad', rate: '10%', bar: 0.10 },
];

export default function AdminDashboard() {
  const { kpiRevenue, kpiOrders, kpiCustomers, kpiAOV, agentLogs, inventory } = useStore();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const kpiCards = [
    { label: 'Revenue', value: `PKR ${(kpiRevenue / 1000).toFixed(1)}k`, change: '+12.5%', Icon: Activity, color: COLORS.success },
    { label: 'Orders', value: kpiOrders.toLocaleString(), change: '+8.2%', Icon: ShoppingBag, color: COLORS.secondary },
    { label: 'Customers', value: `${(kpiCustomers / 1000).toFixed(1)}k`, change: '+24.1%', Icon: Users, color: COLORS.primary },
    { label: 'AOV', value: `PKR ${kpiAOV.toFixed(0)}`, change: '-2.4%', Icon: TrendingUp, color: COLORS.danger },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const lowStock = inventory.filter(p => p.stock < 10);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>GarKS Intel Center</Text>
        </View>
        <TouchableOpacity style={[styles.refreshBtn, isRefreshing && styles.refreshBtnSpin]} onPress={handleRefresh} activeOpacity={0.7}>
          <RefreshCcw size={18} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {/* KPI Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
        {kpiCards.map(card => {
          const { Icon } = card;
          const isPositive = card.change.startsWith('+');
          return (
            <View key={card.label} style={[styles.kpiCard, { borderLeftColor: card.color }]}>
              <View style={[styles.kpiIcon, { backgroundColor: `${card.color}18` }]}>
                <Icon size={20} color={card.color} />
              </View>
              <Text style={styles.kpiValue}>{card.value}</Text>
              <Text style={styles.kpiLabel}>{card.label}</Text>
              <View style={[styles.kpiChangePill, isPositive ? styles.kpiChangePos : styles.kpiChangeNeg]}>
                <Text style={[styles.kpiChangeText, isPositive ? styles.kpiChangePosText : styles.kpiChangeNegText]}>{card.change}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Revenue Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenue Stream · 7 Days</Text>
        <LineChart
          data={SALE_DATA}
          width={CHART_WIDTH}
          height={160}
          chartConfig={CHART_CONFIG}
          bezier
          style={{ borderRadius: 16, marginTop: 8 }}
          withInnerLines={false}
          withOuterLines={false}
        />
      </View>

      {/* Category Yield */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Collection Yield</Text>
        <PieChart
          data={PIE_DATA}
          width={CHART_WIDTH}
          height={160}
          chartConfig={CHART_CONFIG}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="10"
          style={{ marginTop: 4 }}
        />
      </View>

      {/* Peak Hours */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Peak Selling Hours</Text>
        <BarChart
          data={PEAK_DATA}
          width={CHART_WIDTH}
          height={150}
          chartConfig={{ ...CHART_CONFIG, color: (opacity = 1) => `rgba(201, 169, 110, ${opacity * 0.8})` }}
          yAxisLabel=""
          yAxisSuffix=""
          style={{ borderRadius: 16, marginTop: 8 }}
          withInnerLines={false}
        />
      </View>

      {/* Top Cities */}
      <View style={[styles.chartCard, { gap: 14 }]}>
        <Text style={styles.chartTitle}>Top Sales Hubs</Text>
        {TOP_CITIES.map(city => (
          <View key={city.city} style={styles.cityRow}>
            <Text style={styles.cityName}>{city.city}</Text>
            <View style={styles.cityBarBg}>
              <View style={[styles.cityBar, { width: `${city.bar * 100}%` }]} />
            </View>
            <Text style={styles.cityRate}>{city.rate}</Text>
          </View>
        ))}
      </View>

      {/* Gargi Intelligence */}
      <View style={styles.gargiCard}>
        <View style={styles.gargiHeader}>
          <View style={styles.gargiIconWrap}><BrainCircuit size={20} color={COLORS.secondary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gargiTitle}>Gargi Intelligence</Text>
            <Text style={styles.gargiSub}>Health 96% · Active</Text>
          </View>
          {lowStock.length > 0 && (
            <View style={styles.alertBadge}>
              <Zap size={12} color={COLORS.warning} />
              <Text style={styles.alertBadgeText}>{lowStock.length} alerts</Text>
            </View>
          )}
        </View>
        <Text style={styles.gargiQuote}>
          "Revenue up 12% this week. Leather Jacket stock critically low — 8 units remaining. Flash sale recommended to accelerate turnover."
        </Text>
        {agentLogs.length > 0 && (
          <View style={styles.logsPreview}>
            {agentLogs.slice(-3).map((log, i) => (
              <Text key={i} style={styles.logLine} numberOfLines={1}>{log}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Retention */}
      <View style={styles.retentionRow}>
        <View style={[styles.retentionCard, { flex: 1 }]}>
          <Text style={styles.retentionValue}>78.4%</Text>
          <Text style={styles.retentionLabel}>Retention Rate</Text>
        </View>
        <View style={[styles.retentionCard, { flex: 1 }]}>
          <Text style={styles.retentionValue}>+14</Text>
          <Text style={styles.retentionLabel}>Footfall (15m)</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { fontFamily: FONTS.serif, fontSize: 34, color: COLORS.text, fontWeight: '700' },
  subtitle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 3, marginTop: 3 },
  refreshBtn: { width: 44, height: 44, backgroundColor: COLORS.card, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${COLORS.secondary}22` },
  refreshBtnSpin: { opacity: 0.6 },
  kpiCard: { width: 152, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 20, gap: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 20, borderLeftWidth: 3 },
  kpiIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  kpiValue: { fontFamily: FONTS.serif, fontSize: 22, color: COLORS.text, fontWeight: '700' },
  kpiLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  kpiChangePill: { marginTop: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.sm, alignSelf: 'flex-start' },
  kpiChangePos: { backgroundColor: `${COLORS.success}20` },
  kpiChangeNeg: { backgroundColor: `${COLORS.danger}20` },
  kpiChangeText: { fontFamily: FONTS.mono, fontSize: 9, fontWeight: '700' },
  kpiChangePosText: { color: COLORS.success },
  kpiChangeNegText: { color: COLORS.danger },
  chartCard: { marginHorizontal: 20, marginTop: 16, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  chartTitle: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cityName: { fontFamily: FONTS.sansMedium, fontSize: 13, color: COLORS.text, width: 84 },
  cityBarBg: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  cityBar: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 3 },
  cityRate: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.secondary, width: 36, textAlign: 'right' },
  gargiCard: { marginHorizontal: 20, marginTop: 16, backgroundColor: `${COLORS.secondary}0a`, borderRadius: RADIUS['2xl'], padding: 20, gap: 14, borderWidth: 1, borderColor: `${COLORS.secondary}22` },
  gargiHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  gargiIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: `${COLORS.secondary}18`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${COLORS.secondary}22` },
  gargiTitle: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.text },
  gargiSub: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${COLORS.warning}18`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.sm },
  alertBadgeText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.warning },
  gargiQuote: { fontFamily: FONTS.serifItalic, fontSize: 14, color: `${COLORS.text}dd`, lineHeight: 23, fontStyle: 'italic' },
  logsPreview: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: RADIUS.md, padding: 12, gap: 5 },
  logLine: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, lineHeight: 15 },
  retentionRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 12, gap: 12, marginBottom: 8 },
  retentionCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 20, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  retentionValue: { fontFamily: FONTS.serif, fontSize: 30, color: COLORS.secondary, fontWeight: '700' },
  retentionLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
});
