import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, ShoppingBag, TrendingUp, BrainCircuit, ArrowRight } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';
import { haptic } from '../../lib/utils';

const CATEGORIES = [
  { name: 'Men', image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=200&q=80' },
  { name: 'Women', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=200&q=80' },
  { name: 'Bags', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=200&q=80' },
  { name: 'Leather', image: 'https://images.unsplash.com/photo-1590739225287-bd31519780c3?auto=format&fit=crop&w=200&q=80' },
];

export default function CustomerHome({ navigation }: any) {
  const { user, inventory, addToCart, cartFeedback, saleActive, saleDiscount } = useStore();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const featuredProducts = inventory.filter(p => p.stock > 0).slice(0, 6);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.skeletonHeader} />
        <View style={styles.skeletonBanner} />
        <View style={styles.skeletonHero} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Evening, {user?.username?.split(' ')[0] || 'Dear'}</Text>
          <Text style={styles.subGreeting}>Welcome to your private atelier</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')} activeOpacity={0.8}>
          <ShoppingBag size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Sale Banner */}
      {saleActive && (
        <View style={styles.saleBanner}>
          <View style={styles.saleBannerLeft}>
            <View style={styles.saleIcon}>
              <Sparkles size={16} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.saleBannerTitle}>Flash Sale Active</Text>
              <Text style={styles.saleBannerSub}>Enjoy {saleDiscount}% off on selected premium items.</Text>
            </View>
          </View>
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>{saleDiscount}% OFF</Text>
          </View>
        </View>
      )}

      {/* Hero Image */}
      <TouchableOpacity style={styles.heroWrap} onPress={() => navigation.navigate('Shop')} activeOpacity={0.92}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80' }} style={styles.heroImage} />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTag}>New Collection</Text>
          <Text style={styles.heroTitle}>Autumn{'\n'}Atelier</Text>
          <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.navigate('Shop')} activeOpacity={0.85}>
            <Text style={styles.heroBtnText}>Explore Now</Text>
            <ArrowRight size={14} color="#000" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Explore</Text>
      </View>
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={item => item.name}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => { haptic('light'); navigation.navigate('Explore'); }}
            activeOpacity={0.85}
          >
            <Image source={{ uri: item.image }} style={styles.categoryImage} />
            <View style={styles.categoryOverlay}>
              <Text style={styles.categoryName}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Featured Products */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Shop')} activeOpacity={0.7}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={featuredProducts}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => { haptic('light'); navigation.navigate('ProductDetail', { productId: item.id }); }}
            activeOpacity={0.88}
          >
            <View style={styles.productImageWrap}>
              <Image source={{ uri: item.image }} style={styles.productImage} />
              {item.onSale && (
                <View style={styles.salePill}>
                  <Text style={styles.salePillText}>-{item.discountPercent}%</Text>
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category}</Text>
              <View style={styles.productPriceRow}>
                <Text style={styles.productPrice}>${item.price}</Text>
                {item.originalPrice && <Text style={styles.productOriginalPrice}>${item.originalPrice}</Text>}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.addToCartBtn, cartFeedback === item.id && styles.addToCartBtnActive]}
              onPress={() => { haptic('medium'); addToCart(item); }}
              activeOpacity={0.8}
            >
              <Text style={styles.addToCartText}>{cartFeedback === item.id ? '✓ Added' : '+ Cart'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Gargi AI Banner */}
      <View style={styles.gargiCard}>
        <View style={styles.gargiIconWrap}>
          <BrainCircuit size={24} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.gargiTitle}>Gargi Intelligence</Text>
          <Text style={styles.gargiSub}>Revenue up 12% · Leather Jacket stock critically low</Text>
        </View>
        <View style={styles.gargiHealth}>
          <Text style={styles.gargiHealthText}>96%</Text>
        </View>
      </View>

      {/* Trending */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trending Now</Text>
        <View style={styles.trendingBadge}>
          <TrendingUp size={12} color={COLORS.primary} />
          <Text style={styles.trendingBadgeText}>Live</Text>
        </View>
      </View>
      <FlatList
        horizontal
        data={inventory.slice(0, 4)}
        keyExtractor={item => `trend-${item.id}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.trendCard} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} activeOpacity={0.85}>
            <Image source={{ uri: item.image }} style={styles.trendImage} />
            <Text style={styles.trendName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.trendPrice}>${item.price}</Text>
          </TouchableOpacity>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  skeletonHeader: { height: 60, backgroundColor: COLORS.card, margin: 20, borderRadius: RADIUS.lg },
  skeletonBanner: { height: 80, backgroundColor: COLORS.card, marginHorizontal: 20, borderRadius: RADIUS.lg },
  skeletonHero: { height: 300, backgroundColor: COLORS.card, marginHorizontal: 20, marginTop: 12, borderRadius: RADIUS['3xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  greeting: { fontFamily: FONTS.serifItalic, fontSize: 32, color: COLORS.text },
  subGreeting: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 3, marginTop: 2 },
  cartBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: `${COLORS.primary}18`, alignItems: 'center', justifyContent: 'center' },
  saleBanner: { marginHorizontal: 20, marginBottom: 12, backgroundColor: `${COLORS.primary}12`, borderWidth: 1, borderColor: `${COLORS.primary}2a`, borderRadius: RADIUS.xl, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  saleBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  saleIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${COLORS.primary}22`, alignItems: 'center', justifyContent: 'center' },
  saleBannerTitle: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  saleBannerSub: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text, marginTop: 2 },
  saleBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm },
  saleBadgeText: { fontFamily: FONTS.sansBold, fontSize: 10, color: '#000', fontWeight: '700' },
  heroWrap: { marginHorizontal: 20, borderRadius: RADIUS['3xl'], overflow: 'hidden', height: 320, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  heroImage: { width: '100%', height: '100%', opacity: 0.85 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 28 },
  heroTag: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 8 },
  heroTitle: { fontFamily: FONTS.serif, fontSize: 38, color: '#fff', letterSpacing: -1, lineHeight: 44, marginBottom: 16 },
  heroBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: RADIUS.md, alignSelf: 'flex-start' },
  heroBtnText: { fontFamily: FONTS.sansBold, fontSize: 12, color: '#000' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 14 },
  sectionTitle: { fontFamily: FONTS.serif, fontSize: 22, color: COLORS.text },
  seeAll: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 2 },
  categoryCard: { width: 80, height: 80, borderRadius: RADIUS.xl, overflow: 'hidden' },
  categoryImage: { width: '100%', height: '100%' },
  categoryOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, alignItems: 'center' },
  categoryName: { fontFamily: FONTS.sansBold, fontSize: 9, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
  productCard: { width: 160, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  productImageWrap: { position: 'relative' },
  productImage: { width: '100%', height: 160, resizeMode: 'cover' },
  salePill: { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  salePillText: { fontFamily: FONTS.sansBold, fontSize: 9, color: '#000' },
  productInfo: { padding: 12, gap: 3 },
  productName: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.text },
  productCategory: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  productPrice: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.primary },
  productOriginalPrice: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.muted, textDecorationLine: 'line-through' },
  addToCartBtn: { marginHorizontal: 10, marginBottom: 10, backgroundColor: `${COLORS.primary}18`, borderWidth: 1, borderColor: `${COLORS.primary}30`, borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center' },
  addToCartBtnActive: { backgroundColor: `${COLORS.success}22`, borderColor: `${COLORS.success}44` },
  addToCartText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  gargiCard: { marginHorizontal: 20, marginTop: 24, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: `${COLORS.primary}18` },
  gargiIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: `${COLORS.primary}18`, alignItems: 'center', justifyContent: 'center' },
  gargiTitle: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.text },
  gargiSub: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.muted, marginTop: 2 },
  gargiHealth: { backgroundColor: `${COLORS.success}22`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md },
  gargiHealthText: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.success },
  trendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${COLORS.primary}18`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  trendingBadgeText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase' },
  trendCard: { width: 120, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  trendImage: { width: '100%', height: 100, resizeMode: 'cover' },
  trendName: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text, padding: 8, paddingBottom: 2, lineHeight: 15 },
  trendPrice: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.primary, paddingHorizontal: 8, paddingBottom: 10 },
});
