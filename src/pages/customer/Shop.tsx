import { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Star } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';
import { haptic } from '../../lib/utils';

const FILTERS = ['All', 'Shirts', 'Pants', 'Leather Jackets', 'Hoodies', 'Women', 'Polo Shirts'];

export default function Shop({ navigation }: any) {
  const { inventory, addToCart, cartFeedback, wishlist, toggleWishlist } = useStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const insets = useSafeAreaInsets();

  const filtered = inventory.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' || p.category === activeFilter;
    return matchSearch && matchFilter;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.count}>{filtered.length} items</Text>
      </View>

      <View style={styles.searchWrap}>
        <Search size={16} color={COLORS.muted} />
        <TextInput style={styles.searchInput} placeholder="Search collections..." placeholderTextColor={COLORS.muted} value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.filterChip, item === activeFilter && styles.filterChipActive]} onPress={() => setActiveFilter(item)} activeOpacity={0.75}>
            <Text style={[styles.filterChipText, item === activeFilter && styles.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 20 }}
        columnWrapperStyle={{ gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isWishlisted = wishlist.includes(item.id);
          const isAdded = cartFeedback === item.id;
          return (
            <TouchableOpacity style={styles.card} onPress={() => { haptic('light'); navigation.navigate('ProductDetail', { productId: item.id }); }} activeOpacity={0.88}>
              <View style={styles.imageWrap}>
                <Image source={{ uri: item.image }} style={styles.image} />
                {item.onSale && <View style={styles.salePill}><Text style={styles.salePillText}>-{item.discountPercent}%</Text></View>}
                {item.stock === 0 && <View style={styles.outOfStockOverlay}><Text style={styles.outOfStockText}>OUT OF STOCK</Text></View>}
                <TouchableOpacity style={[styles.wishBtn, isWishlisted && styles.wishBtnActive]} onPress={() => { haptic('light'); toggleWishlist(item.id); }} activeOpacity={0.8}>
                  <Text style={{ fontSize: 12, color: isWishlisted ? COLORS.danger : '#fff' }}>{isWishlisted ? '♥' : '♡'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardCategory}>{item.category}</Text>
                <View style={styles.ratingRow}>
                  <Star size={10} color={COLORS.warning} fill={COLORS.warning} />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>${item.price}</Text>
                  {item.originalPrice && <Text style={styles.originalPrice}>${item.originalPrice}</Text>}
                </View>
                <TouchableOpacity style={[styles.addBtn, isAdded && styles.addBtnActive, item.stock === 0 && styles.addBtnDisabled]} onPress={() => { if (item.stock > 0) { haptic('medium'); addToCart(item); } }} activeOpacity={0.8} disabled={item.stock === 0}>
                  <Text style={[styles.addBtnText, isAdded && styles.addBtnTextActive]}>{item.stock === 0 ? 'Out of Stock' : isAdded ? '✓ Added' : 'Add to Cart'}</Text>
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
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontFamily: FONTS.serif, fontSize: 30, color: COLORS.text },
  count: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: 20, marginBottom: 12, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  searchInput: { flex: 1, fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: COLORS.card },
  filterChipActive: { backgroundColor: `${COLORS.primary}18`, borderColor: `${COLORS.primary}44` },
  filterChipText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  filterChipTextActive: { color: COLORS.primary },
  card: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 150, resizeMode: 'cover' },
  salePill: { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.primary, paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.sm },
  salePillText: { fontFamily: FONTS.sansBold, fontSize: 8, color: '#000' },
  outOfStockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  outOfStockText: { fontFamily: FONTS.mono, fontSize: 9, color: '#fff', letterSpacing: 2 },
  wishBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  wishBtnActive: { backgroundColor: `${COLORS.danger}33` },
  cardBody: { padding: 12, gap: 3 },
  cardName: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.text },
  cardCategory: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.warning },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  price: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.primary },
  originalPrice: { fontFamily: FONTS.sans, fontSize: 10, color: COLORS.muted, textDecorationLine: 'line-through' },
  addBtn: { marginTop: 8, backgroundColor: `${COLORS.primary}18`, borderWidth: 1, borderColor: `${COLORS.primary}30`, borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center' },
  addBtnActive: { backgroundColor: `${COLORS.success}20`, borderColor: `${COLORS.success}44` },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  addBtnTextActive: { color: COLORS.success },
});
