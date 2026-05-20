import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Package, Truck, Home, MapPin, CheckCircle2 } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';

const STATUSES = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

export default function OrderTracking({ route, navigation }: any) {
  const { orderId } = route?.params || {};
  const { orders } = useStore();
  const insets = useSafeAreaInsets();
  const order = orders.find(o => o.id === orderId) || orders[0];

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}><ChevronLeft size={20} color={COLORS.muted} /></TouchableOpacity>
        <Text style={styles.noOrderText}>No orders to track yet</Text>
      </View>
    );
  }

  const currentIndex = STATUSES.indexOf(order.status);
  const ICONS = [Package, Truck, MapPin, Home];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}><ChevronLeft size={20} color={COLORS.muted} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Track Order</Text>
          <Text style={styles.orderId}>{order.id}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 80 }}>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Current Status</Text>
          <Text style={styles.statusValue}>{order.status}</Text>
          <Text style={styles.trackingNumber}>Tracking: {order.trackingNumber}</Text>
        </View>

        {/* Progress Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.sectionTitle}>Delivery Progress</Text>
          {STATUSES.map((status, i) => {
            const isDone = i <= currentIndex;
            const isCurrent = i === currentIndex;
            const Icon = ICONS[i];
            return (
              <View key={status} style={styles.step}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepIcon, isDone ? styles.stepIconDone : styles.stepIconPending, isCurrent && styles.stepIconCurrent]}>
                    {isDone ? <CheckCircle2 size={16} color={isCurrent ? '#000' : COLORS.success} /> : <Icon size={16} color={COLORS.muted} />}
                  </View>
                  {i < STATUSES.length - 1 && <View style={[styles.stepLine, isDone && styles.stepLineDone]} />}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLabel, isDone && styles.stepLabelDone, isCurrent && styles.stepLabelCurrent]}>{status}</Text>
                  {isCurrent && <Text style={styles.stepSub}>Your order is currently at this stage</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Order Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Order Items ({order.items.length})</Text>
          {order.items.map(item => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.orderItemDot} />
              <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.orderItemQty}>×{item.quantity}</Text>
              <Text style={styles.orderItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, backgroundColor: COLORS.card, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONTS.serif, fontSize: 26, color: COLORS.text },
  orderId: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, marginTop: 2 },
  noOrderText: { fontFamily: FONTS.sans, fontSize: 16, color: COLORS.muted },
  statusCard: { backgroundColor: `${COLORS.primary}12`, borderWidth: 1, borderColor: `${COLORS.primary}2a`, borderRadius: RADIUS['2xl'], padding: 20, gap: 6 },
  statusLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 3 },
  statusValue: { fontFamily: FONTS.serif, fontSize: 28, color: COLORS.primary },
  trackingNumber: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted },
  stepsCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 20, gap: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  sectionTitle: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 },
  step: { flexDirection: 'row', gap: 14 },
  stepLeft: { alignItems: 'center', width: 36 },
  stepIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepIconDone: { backgroundColor: `${COLORS.success}22` },
  stepIconPending: { backgroundColor: COLORS.cardAlt },
  stepIconCurrent: { backgroundColor: COLORS.primary },
  stepLine: { width: 2, flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', minHeight: 20, marginVertical: 4 },
  stepLineDone: { backgroundColor: `${COLORS.success}44` },
  stepContent: { flex: 1, paddingBottom: 24, paddingTop: 6 },
  stepLabel: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.muted },
  stepLabelDone: { color: COLORS.text },
  stepLabelCurrent: { color: COLORS.primary },
  stepSub: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.muted, marginTop: 4 },
  itemsCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 20, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  orderItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderItemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  orderItemName: { flex: 1, fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text },
  orderItemQty: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.muted },
  orderItemPrice: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.primary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', marginTop: 4 },
  totalLabel: { fontFamily: FONTS.serif, fontSize: 16, color: COLORS.text },
  totalValue: { fontFamily: FONTS.serif, fontSize: 20, color: COLORS.primary },
});
