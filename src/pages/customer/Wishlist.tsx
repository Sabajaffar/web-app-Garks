import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Trash2, ShoppingBag } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';
import { haptic } from '../../lib/utils';

export default function Wishlist({ navigation }: any) {
  const { inventory, wishlist, toggleWishlist, addToCart, cartFeedback } = useStore();
  const insets = useSafeAreaInsets();
  const wishlisted = inventory.filter(p => wishlist.includes(p.id));

  if (wishlisted.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, { paddingTop: insets.top + 20 }]}>
        <Heart size={56} color={`${COLORS.muted}44`} strokeWidth={1} />
        <Text style={styles.emptyTitle}>Your cabinet is empty</Text>
        <Text style={styles.emptySubtitle}>Save items you love to find them easily later</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Shop')} activeOpacity={0.85}>
          <Text style={styles.shopBtnText}>Discover Collections</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Cabinet</Text>
        <Text style={styles.count}>{wishlisted.length} saved</Text>
      </View>

      <FlatList
        data={wishlisted}
        keyExtractor={p => p.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 80 }}
        columnWrapperStyle={{ gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isAdded = cartFeedback === item.id;
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} activeOpacity={0.88}>
              <View style={styles.imageWrap}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => { haptic('light'); toggleWishlist(item.id); }} activeOpacity={0.8}>
                  <Trash2 size={13} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.price}>${item.price}</Text>
                <TouchableOpacity
                  style={[styles.addBtn, isAdded && styles.addBtnActive]}
                  onPress={() => { haptic('medium'); addToCart(item); }}
                  activeOpacity={0.8}
                >
                  <ShoppingBag size={12} color={isAdded ? COLORS.success : COLORS.primary} />
                  <Text style={[styles.addBtnText, isAdded && styles.addBtnTextActive]}>{isAdded ? 'Added' : 'Add to Cart'}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 40 },
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontFamily: FONTS.serif, fontSize: 30, color: COLORS.text },
  count: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted },
  emptyTitle: { fontFamily: FONTS.serif, fontSize: 24, color: COLORS.text, textAlign: 'center' },
  emptySubtitle: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },
  shopBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: RADIUS.xl, marginTop: 8 },
  shopBtnText: { fontFamily: FONTS.sansBold, fontSize: 14, color: '#000' },
  card: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 150, resizeMode: 'cover' },
  removeBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: `${COLORS.danger}2a`, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 12, gap: 3 },
  name: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.text },
  category: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  price: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.primary, marginTop: 4 },
  addBtn: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: `${COLORS.primary}18`, borderWidth: 1, borderColor: `${COLORS.primary}30`, borderRadius: RADIUS.md, paddingVertical: 8 },
  addBtnActive: { backgroundColor: `${COLORS.success}18`, borderColor: `${COLORS.success}30` },
  addBtnText: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  addBtnTextActive: { color: COLORS.success },
});
