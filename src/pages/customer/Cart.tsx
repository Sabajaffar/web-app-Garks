import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, Truck } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';
import { haptic } from '../../lib/utils';

export default function Cart({ navigation }: any) {
  const { cart, removeFromCart, updateCartQuantity, placeOrder } = useStore();
  const insets = useSafeAreaInsets();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 200 ? 0 : 12;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}><ChevronLeft size={20} color={COLORS.muted} /></TouchableOpacity>
        <ShoppingBag size={56} color={`${COLORS.muted}44`} strokeWidth={1} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Discover our premium collections</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.shopBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}><ChevronLeft size={20} color={COLORS.muted} /></TouchableOpacity>
        <Text style={styles.title}>Cart</Text>
        <Text style={styles.itemCount}>{cart.length} {cart.length === 1 ? 'item' : 'items'}</Text>
      </View>

      <FlatList
        data={cart}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
              <View style={styles.itemPriceRow}>
                <Text style={styles.itemPrice}>${item.price}</Text>
                {item.originalPrice && <Text style={styles.itemOriginalPrice}>${item.originalPrice}</Text>}
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => { haptic('light'); updateCartQuantity(item.id, item.quantity - 1); }} activeOpacity={0.8}>
                  <Minus size={12} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => { haptic('light'); updateCartQuantity(item.id, item.quantity + 1); }} activeOpacity={0.8}>
                  <Plus size={12} color={COLORS.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => { haptic('medium'); removeFromCart(item.id); }} activeOpacity={0.8}>
                  <Trash2 size={14} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={[styles.summaryValue, shipping === 0 && { color: COLORS.success }]}>{shipping === 0 ? 'Free' : `$${shipping}`}</Text>
            </View>
            {shipping === 0 && <View style={styles.freeShippingNote}><Truck size={12} color={COLORS.success} /><Text style={styles.freeShippingText}>Free shipping on orders over $200</Text></View>}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
            <View style={styles.trustRow}>
              <View style={styles.trustItem}><ShieldCheck size={13} color={COLORS.primary} /><Text style={styles.trustText}>Secure Checkout</Text></View>
            </View>
          </View>
        )}
      />

      <View style={[styles.checkoutBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => { haptic('success'); placeOrder(total); navigation.goBack(); }} activeOpacity={0.85}>
          <Text style={styles.checkoutBtnText}>Place Order · ${total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, backgroundColor: COLORS.card, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: FONTS.serif, fontSize: 28, color: COLORS.text },
  itemCount: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted },
  emptyTitle: { fontFamily: FONTS.serif, fontSize: 24, color: COLORS.text },
  emptySubtitle: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted },
  shopBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: RADIUS.xl, marginTop: 8 },
  shopBtnText: { fontFamily: FONTS.sansBold, fontSize: 14, color: '#000' },
  cartItem: { flexDirection: 'row', gap: 14, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  itemImage: { width: 80, height: 90, borderRadius: RADIUS.lg, resizeMode: 'cover' },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.text, lineHeight: 18 },
  itemCategory: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemPrice: { fontFamily: FONTS.sansBold, fontSize: 15, color: COLORS.primary },
  itemOriginalPrice: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.muted, textDecorationLine: 'line-through' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  qtyBtn: { width: 28, height: 28, backgroundColor: COLORS.cardAlt, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.text, minWidth: 20, textAlign: 'center' },
  removeBtn: { marginLeft: 8, width: 28, height: 28, backgroundColor: `${COLORS.danger}18`, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 18, gap: 12, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  summaryTitle: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted },
  summaryValue: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.text },
  freeShippingNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${COLORS.success}12`, padding: 10, borderRadius: RADIUS.md },
  freeShippingText: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.success },
  totalRow: { paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  totalLabel: { fontFamily: FONTS.serif, fontSize: 18, color: COLORS.text },
  totalValue: { fontFamily: FONTS.serif, fontSize: 22, color: COLORS.primary },
  trustRow: { flexDirection: 'row', justifyContent: 'center' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  checkoutBar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  checkoutBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 18, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  checkoutBtnText: { fontFamily: FONTS.sansBold, fontSize: 15, color: '#000' },
});
