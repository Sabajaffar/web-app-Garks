import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, AlertTriangle, CheckCircle2, Search, Trash2, Zap, Package, User } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS } from '../../theme';

const INITIAL_ALERTS = [
  { id: 1, type: 'critical', title: 'Critical Stock Level', msg: 'Vintage Leather Jacket (SKU: VLJ-BLK-M) is now out of stock.', time: '2 mins ago', icon: Package },
  { id: 2, type: 'high', title: 'New VIP Registration', msg: 'Elite customer Alex Vance has joined the platform.', time: '14 mins ago', icon: User },
  { id: 3, type: 'info', title: 'Insight Available', msg: 'Gargi has detected a new trend in "Polo Shirts" search queries.', time: '1 hr ago', icon: Zap },
  { id: 4, type: 'low', title: 'System Healthy', msg: 'All store monitoring cameras are operational and syncing.', time: '4 hrs ago', icon: CheckCircle2 },
];

export default function Alerts() {
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [search, setSearch] = useState('');

  const filtered = alerts.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.msg.toLowerCase().includes(search.toLowerCase())
  );

  const removeAlert = (id: number) => setAlerts(prev => prev.filter(a => a.id !== id));

  const getCardStyle = (type: string) => {
    if (type === 'critical') return { backgroundColor: `${COLORS.danger}12`, borderColor: `${COLORS.danger}30` };
    if (type === 'high') return { backgroundColor: `${COLORS.primary}12`, borderColor: `${COLORS.primary}22` };
    return { backgroundColor: COLORS.card, borderColor: 'rgba(255,255,255,0.04)' };
  };

  const getIconStyle = (type: string) => {
    if (type === 'critical') return { backgroundColor: `${COLORS.danger}22`, color: COLORS.danger };
    if (type === 'high') return { backgroundColor: `${COLORS.primary}22`, color: COLORS.primary };
    return { backgroundColor: COLORS.bg, color: COLORS.muted };
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alerts Centre</Text>
          <Text style={styles.subtitle}>Operational Intelligence</Text>
        </View>
        <View style={styles.bellWrap}>
          <Bell size={20} color={COLORS.muted} />
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Search size={18} color={COLORS.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter notifications..."
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={a => String(a.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 80 }}
        renderItem={({ item }) => {
          const cardStyle = getCardStyle(item.type);
          const iconStyle = getIconStyle(item.type);
          const Icon = item.icon;
          return (
            <View style={[styles.alertCard, { backgroundColor: cardStyle.backgroundColor, borderColor: cardStyle.borderColor }]}>
              <View style={[styles.alertIcon, { backgroundColor: iconStyle.backgroundColor }]}>
                <Icon size={20} color={iconStyle.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.alertTitleRow}>
                  <Text style={[styles.alertTitle, item.type === 'critical' && { color: COLORS.danger }]}>{item.title}</Text>
                  <Text style={styles.alertTime}>{item.time}</Text>
                </View>
                <Text style={styles.alertMsg}>{item.msg}</Text>
              </View>
              <TouchableOpacity onPress={() => removeAlert(item.id)} style={styles.trashBtn} activeOpacity={0.7}>
                <Trash2 size={16} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <CheckCircle2 size={64} color={`${COLORS.primary}33`} />
            <Text style={styles.emptyText}>Inbox Zero. Your store is running at peak efficiency.</Text>
          </View>
        }
        ListFooterComponent={
          alerts.length > 0 ? (
            <TouchableOpacity onPress={() => setAlerts([])} style={styles.clearBtn} activeOpacity={0.7}>
              <Text style={styles.clearBtnText}>Clear All Notifications</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontFamily: FONTS.serif, fontSize: 30, color: COLORS.text },
  subtitle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  bellWrap: { width: 44, height: 44, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  searchInput: { flex: 1, fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text },
  alertCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 20, borderRadius: RADIUS['2xl'], borderWidth: 1 },
  alertIcon: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  alertTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  alertTitle: { fontFamily: FONTS.serif, fontSize: 16, color: COLORS.text, flex: 1 },
  alertTime: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  alertMsg: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted, lineHeight: 18 },
  trashBtn: { padding: 6, flexShrink: 0 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { fontFamily: FONTS.serifItalic, fontSize: 16, color: COLORS.muted, textAlign: 'center', paddingHorizontal: 32, lineHeight: 24 },
  clearBtn: { alignItems: 'center', paddingVertical: 20, marginTop: 8 },
  clearBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 3 },
});
