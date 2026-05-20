import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Check, Zap, Info, Trash2, ChevronLeft, Package } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';

const TYPE_CONFIG: Record<string, { color: string; Icon: any }> = {
  sale: { color: COLORS.warning, Icon: Zap },
  info: { color: COLORS.primary, Icon: Info },
  order: { color: COLORS.success, Icon: Check },
  inventory: { color: COLORS.purple, Icon: Package },
};

export default function Notifications({ navigation }: any) {
  const { notifications, markNotificationsRead, clearNotifications } = useStore();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}><ChevronLeft size={20} color={COLORS.muted} /></TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={markNotificationsRead} activeOpacity={0.7}><Text style={styles.actionText}>Mark all read</Text></TouchableOpacity>
          <TouchableOpacity onPress={clearNotifications} activeOpacity={0.7}><Trash2 size={16} color={COLORS.danger} /></TouchableOpacity>
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={48} color={`${COLORS.muted}44`} strokeWidth={1} />
          <Text style={styles.emptyTitle}>All quiet here</Text>
          <Text style={styles.emptySubtitle}>You're all caught up</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 80 }}
          renderItem={({ item }) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
            const { Icon } = config;
            return (
              <View style={[styles.notifCard, !item.read && styles.notifCardUnread]}>
                <View style={[styles.iconWrap, { backgroundColor: `${config.color}18` }]}>
                  <Icon size={16} color={config.color} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
                  <Text style={styles.notifTime}>{item.time}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, backgroundColor: COLORS.card, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: FONTS.serif, fontSize: 26, color: COLORS.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontFamily: FONTS.serif, fontSize: 22, color: COLORS.text },
  emptySubtitle: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted },
  notifCard: { flexDirection: 'row', gap: 14, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  notifCardUnread: { borderColor: `${COLORS.primary}22`, backgroundColor: `${COLORS.primary}06` },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifContent: { flex: 1, gap: 3 },
  notifTitle: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.text, lineHeight: 17 },
  notifMessage: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted, lineHeight: 17 },
  notifTime: { fontFamily: FONTS.mono, fontSize: 9, color: `${COLORS.muted}88` },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, alignSelf: 'flex-start', marginTop: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 4 },
});
