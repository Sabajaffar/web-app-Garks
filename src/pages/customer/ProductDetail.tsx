import { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Star, Heart, ShoppingBag, ShieldCheck } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';
import { haptic } from '../../lib/utils';

export default function ProductDetail({ route, navigation }: any) {
  const { productId } = route.params || {};
  const { inventory, addToCart, toggleWishlist, wishlist, cartFeedback } = useStore();
  const product = inventory.find(p => p.id === productId);
  const insets = useSafeAreaInsets();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showReviews, setShowReviews] = useState(false);

  if (!product) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><ChevronLeft size={20} color={COLORS.muted} /></TouchableOpacity>
        <Text style={styles.notFound}>Product not found</Text>
      </View>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const isAdded = cartFeedback === product.id;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back + Wishlist header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}><ChevronLeft size={20} color={COLORS.muted} /></TouchableOpacity>
        <TouchableOpacity style={[styles.wishBtn, isWishlisted && styles.wishBtnActive]} onPress={() => { haptic('light'); toggleWishlist(product.id); }} activeOpacity={0.7}>
          <Heart size={18} color={isWishlisted ? COLORS.danger : COLORS.muted} fill={isWishlisted ? COLORS.danger : 'none'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Product Image */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: product.image }} style={styles.image} />
          {product.onSale && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>-{product.discountPercent}% OFF</Text>
            </View>
          )}
          {product.stock === 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sku}>{product.sku || product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.ratingRow}>
            {[1,2,3,4,5].map(i => <Star key={i} size={12} color={COLORS.warning} fill={i <= Math.floor(product.rating) ? COLORS.warning : 'none'} />)}
            <Text style={styles.ratingText}>{product.rating} · {product.reviews?.length || 0} reviews</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price}</Text>
            {product.originalPrice && <Text style={styles.originalPrice}>${product.originalPrice}</Text>}
            {product.stock < 10 && product.stock > 0 && <View style={styles.lowStockPill}><Text style={styles.lowStockText}>Only {product.stock} left</Text></View>}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Sizes */}
        {product.variants.size.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Size</Text>
            <View style={styles.variantRow}>
              {product.variants.size.map(s => (
                <TouchableOpacity key={s} style={[styles.variantChip, selectedSize === s && styles.variantChipActive]} onPress={() => setSelectedSize(s)} activeOpacity={0.75}>
                  <Text style={[styles.variantChipText, selectedSize === s && styles.variantChipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Colors */}
        {product.variants.color.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color</Text>
            <View style={styles.variantRow}>
              {product.variants.color.map(c => (
                <TouchableOpacity key={c} style={[styles.variantChip, selectedColor === c && styles.variantChipActive]} onPress={() => setSelectedColor(c)} activeOpacity={0.75}>
                  <Text style={[styles.variantChipText, selectedColor === c && styles.variantChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Trust Badges */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}><ShieldCheck size={14} color={COLORS.primary} /><Text style={styles.trustText}>Authentic</Text></View>
          <View style={styles.trustItem}><ShoppingBag size={14} color={COLORS.primary} /><Text style={styles.trustText}>Free Returns</Text></View>
          <View style={styles.trustItem}><Star size={14} color={COLORS.primary} /><Text style={styles.trustText}>Premium Quality</Text></View>
        </View>

        {/* Reviews */}
        {product.reviews && product.reviews.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.reviewsHeader} onPress={() => setShowReviews(!showReviews)} activeOpacity={0.7}>
              <Text style={styles.sectionTitle}>Reviews ({product.reviews.length})</Text>
              <Text style={styles.reviewsToggle}>{showReviews ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
            {showReviews && product.reviews.map(r => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>{r.user}</Text>
                  <View style={styles.reviewStars}>
                    {[1,2,3,4,5].map(i => <Star key={i} size={10} color={COLORS.warning} fill={i <= r.rating ? COLORS.warning : 'none'} />)}
                  </View>
                </View>
                <Text style={styles.reviewText}>{r.comment}</Text>
                <Text style={styles.reviewDate}>{r.date}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add to Cart */}
      <View style={[styles.cartBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.cartBtn, isAdded && styles.cartBtnAdded, product.stock === 0 && styles.cartBtnDisabled]}
          onPress={() => { if (product.stock > 0) { haptic('medium'); addToCart(product); } }}
          activeOpacity={0.85}
          disabled={product.stock === 0}
        >
          <ShoppingBag size={18} color="#000" />
          <Text style={styles.cartBtnText}>
            {product.stock === 0 ? 'Out of Stock' : isAdded ? '✓ Added to Cart' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, backgroundColor: COLORS.card, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wishBtn: { width: 40, height: 40, backgroundColor: COLORS.card, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wishBtnActive: { backgroundColor: `${COLORS.danger}1a` },
  notFound: { fontFamily: FONTS.sans, fontSize: 16, color: COLORS.muted, textAlign: 'center', marginTop: 40 },
  imageWrap: { marginHorizontal: 16, borderRadius: RADIUS['2xl'], overflow: 'hidden', height: 320, position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  saleBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.sm },
  saleBadgeText: { fontFamily: FONTS.sansBold, fontSize: 10, color: '#000' },
  outOfStockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  outOfStockText: { fontFamily: FONTS.mono, fontSize: 12, color: '#fff', letterSpacing: 3 },
  infoSection: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },
  sku: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 4 },
  name: { fontFamily: FONTS.serif, fontSize: 28, color: COLORS.text, letterSpacing: -0.5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, marginLeft: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { fontFamily: FONTS.serif, fontSize: 28, color: COLORS.primary },
  originalPrice: { fontFamily: FONTS.sans, fontSize: 16, color: COLORS.muted, textDecorationLine: 'line-through' },
  lowStockPill: { backgroundColor: `${COLORS.danger}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  lowStockText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.danger, textTransform: 'uppercase' },
  section: { paddingHorizontal: 20, paddingTop: 20, gap: 10 },
  sectionTitle: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  description: { fontFamily: FONTS.sans, fontSize: 14, color: COLORS.muted, lineHeight: 22 },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: COLORS.card },
  variantChipActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}18` },
  variantChipText: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted },
  variantChipTextActive: { color: COLORS.primary, fontFamily: FONTS.sansBold },
  trustRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, paddingTop: 20 },
  trustItem: { alignItems: 'center', gap: 4 },
  trustText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewsToggle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 2 },
  reviewCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewUser: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.text },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewText: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted, lineHeight: 20 },
  reviewDate: { fontFamily: FONTS.mono, fontSize: 9, color: `${COLORS.muted}88` },
  cartBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.bg, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  cartBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  cartBtnAdded: { backgroundColor: COLORS.success },
  cartBtnDisabled: { opacity: 0.5 },
  cartBtnText: { fontFamily: FONTS.sansBold, fontSize: 15, color: '#000' },
});
