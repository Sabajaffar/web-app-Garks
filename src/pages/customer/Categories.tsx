import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Shirt, ShoppingBag, User, Briefcase } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS } from '../../theme';
import { haptic } from '../../lib/utils';

const CATEGORIES = [
  { name: "Men's Collection", sub: 'Shirts, Pants, Jackets', icon: Shirt, image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=400&q=80', count: '5 items' },
  { name: "Women's Collection", sub: 'Blouses, Coats, Trousers', icon: User, image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80', count: '4 items' },
  { name: 'Leather Goods', sub: 'Jackets, Bags, Accessories', icon: Briefcase, image: 'https://images.unsplash.com/photo-1590739225287-bd31519780c3?auto=format&fit=crop&w=400&q=80', count: '1 item' },
  { name: 'Bags & Accessories', sub: 'Totes, Clutches, Wallets', icon: ShoppingBag, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80', count: 'Curated' },
];

const FEATURED = [
  { label: 'New Arrivals', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Best Sellers', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80' },
];

export default function Categories({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <FlatList
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      data={CATEGORIES}
      keyExtractor={item => item.name}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={() => (
        <View>
          <View style={styles.header}>
            <Text style={styles.title}>Explore</Text>
            <Text style={styles.subtitle}>Curated Collections</Text>
          </View>

          {/* Featured Banners */}
          <FlatList
            horizontal
            data={FEATURED}
            keyExtractor={f => f.label}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.featuredCard} onPress={() => { haptic('light'); navigation.navigate('Shop'); }} activeOpacity={0.88}>
                <Image source={{ uri: item.image }} style={styles.featuredImage} />
                <View style={styles.featuredOverlay}>
                  <Text style={styles.featuredLabel}>{item.label}</Text>
                  <ChevronRight size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
          />

          <Text style={styles.sectionLabel}>All Categories</Text>
        </View>
      )}
      renderItem={({ item }) => {
        const { icon: Icon } = item as any;
        return (
          <TouchableOpacity style={styles.categoryRow} onPress={() => { haptic('light'); navigation.navigate('Shop'); }} activeOpacity={0.85}>
            <Image source={{ uri: item.image }} style={styles.categoryThumb} />
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categorySub}>{item.sub}</Text>
              <Text style={styles.categoryCount}>{item.count}</Text>
            </View>
            <ChevronRight size={18} color={COLORS.muted} />
          </TouchableOpacity>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 24, paddingVertical: 20 },
  title: { fontFamily: FONTS.serif, fontSize: 30, color: COLORS.text },
  subtitle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 4, marginTop: 4 },
  sectionLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 3, paddingHorizontal: 24, paddingBottom: 12 },
  featuredCard: { width: 200, height: 120, borderRadius: RADIUS.xl, overflow: 'hidden' },
  featuredImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredLabel: { fontFamily: FONTS.sansBold, fontSize: 12, color: '#fff' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.card, marginHorizontal: 16, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  categoryThumb: { width: 56, height: 56, borderRadius: RADIUS.md, resizeMode: 'cover' },
  categoryInfo: { flex: 1, gap: 3 },
  categoryName: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.text },
  categorySub: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted },
  categoryCount: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  separator: { height: 10 },
});
