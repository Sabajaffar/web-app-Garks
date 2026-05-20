import { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Plus, AlertTriangle, Zap, Package, BrainCircuit } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';
import { haptic } from '../../lib/utils';

export default function Inventory() {
  const { inventory, suppliers, orderSupplierRestock, addProduct, gargiProactiveInsight } = useStore();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '', image: '' });
  const insets = useSafeAreaInsets();

  const insight = gargiProactiveInsight('inventory');

  const filtered = inventory.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const getStockColor = (stock: number) => {
    if (stock === 0) return COLORS.danger;
    if (stock < 5) return COLORS.warning;
    if (stock < 10) return '#fb923c';
    return COLORS.success;
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price) return;
    addProduct({
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price) || 0,
      stock: parseInt(newProduct.stock) || 0,
      image: newProduct.image || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80',
      description: 'New product added by admin.',
      variants: { size: ['M', 'L'], color: ['Black'] },
      rating: 4.0,
    });
    setShowAddModal(false);
    setNewProduct({ name: '', category: '', price: '', stock: '', image: '' });
    haptic('success');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>Managed by GarKS Intel</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
          <Plus size={16} color={COLORS.bg} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Gargi AI Insights */}
      <View style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <View style={styles.insightIconWrap}>
            <BrainCircuit size={14} color={COLORS.secondary} />
          </View>
          <Text style={styles.insightTitle}>Gargi Intelligence</Text>
        </View>
        <Text style={styles.insightText}>{insight}</Text>
      </View>

      {/* Active Vendors */}
      <Text style={styles.sectionLabel}>Active Vendors</Text>
      <FlatList
        horizontal
        data={suppliers}
        keyExtractor={s => s.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 14 }}
        renderItem={({ item }) => (
          <View style={styles.vendorCard}>
            <View style={styles.vendorAvatarWrap}>
              <Text style={styles.vendorAvatarText}>{item.contactPerson[0]}</Text>
            </View>
            <Text style={styles.vendorName} numberOfLines={1}>{item.company}</Text>
            <Text style={styles.vendorCategory}>{item.category}</Text>
            <View style={styles.vendorRating}>
              <Zap size={10} color={COLORS.secondary} fill={COLORS.secondary} />
              <Text style={styles.vendorRatingText}>★ {item.rating}</Text>
            </View>
          </View>
        )}
      />

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={16} color={COLORS.muted} />
        <TextInput style={styles.searchInput} placeholder="Search inventory..." placeholderTextColor={COLORS.muted} value={search} onChangeText={setSearch} />
      </View>

      {/* Product List */}
      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 80 }}
        renderItem={({ item }) => {
          const stockColor = getStockColor(item.stock);
          const needsRestock = item.stock < 10;
          return (
            <View style={styles.productRow}>
              <View style={[styles.stockIndicator, { backgroundColor: `${stockColor}18`, borderColor: `${stockColor}33` }]}>
                <Package size={15} color={stockColor} />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.productMetaRow}>
                  <Text style={styles.productSku}>{item.sku}</Text>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{item.category}</Text>
                  </View>
                </View>
                <View style={styles.productMeta}>
                  <Text style={styles.productPrice}>PKR {item.price}</Text>
                  <View style={[styles.stockPill, { backgroundColor: `${stockColor}15`, borderColor: `${stockColor}30`, borderWidth: 1 }]}>
                    <Text style={[styles.stockText, { color: stockColor }]}>{item.stock} units</Text>
                  </View>
                </View>
              </View>
              {needsRestock && (
                <TouchableOpacity
                  style={styles.restockBtn}
                  onPress={() => { haptic('medium'); orderSupplierRestock(item.id, 100, 's1', true); }}
                  activeOpacity={0.8}
                >
                  <AlertTriangle size={12} color={COLORS.warning} />
                  <Text style={styles.restockBtnText}>Restock</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Add Product Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Product</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {[
                { key: 'name', label: 'Product Name' },
                { key: 'category', label: 'Category' },
                { key: 'price', label: 'Price (PKR)', keyboardType: 'numeric' },
                { key: 'stock', label: 'Initial Stock', keyboardType: 'numeric' },
                { key: 'image', label: 'Image URL (optional)' },
              ].map(field => (
                <View key={field.key} style={styles.modalField}>
                  <Text style={styles.modalLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholderTextColor={COLORS.muted}
                    value={newProduct[field.key as keyof typeof newProduct]}
                    onChangeText={v => setNewProduct(prev => ({ ...prev, [field.key]: v }))}
                    keyboardType={(field as any).keyboardType || 'default'}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddProduct} activeOpacity={0.85}>
                <Text style={styles.modalConfirmText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { fontFamily: FONTS.serif, fontSize: 34, color: COLORS.text, fontWeight: '700' },
  subtitle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 3 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: RADIUS.lg, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  addBtnText: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.bg },
  insightCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: `${COLORS.secondary}0d`, borderRadius: RADIUS['2xl'], padding: 16, borderWidth: 1, borderColor: `${COLORS.secondary}22`, gap: 10 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  insightIconWrap: { width: 28, height: 28, borderRadius: 10, backgroundColor: `${COLORS.secondary}18`, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  insightText: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text, lineHeight: 20 },
  sectionLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 3, paddingHorizontal: 24, marginBottom: 10 },
  vendorCard: { width: 165, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: 16, gap: 4, borderWidth: 1, borderColor: `${COLORS.secondary}18` },
  vendorAvatarWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: `${COLORS.secondary}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  vendorAvatarText: { fontFamily: FONTS.serif, fontSize: 16, color: COLORS.secondary, fontWeight: '700' },
  vendorName: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.text },
  vendorCategory: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  vendorRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  vendorRatingText: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.secondary },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: 20, marginBottom: 14, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 13, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  searchInput: { flex: 1, fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  stockIndicator: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  productInfo: { flex: 1, gap: 4 },
  productName: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.text },
  productMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productSku: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  categoryTag: { paddingHorizontal: 7, paddingVertical: 2, backgroundColor: `${COLORS.secondary}15`, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: `${COLORS.secondary}22` },
  categoryTagText: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 1 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  productPrice: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.primary },
  stockPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: RADIUS.sm },
  stockText: { fontFamily: FONTS.mono, fontSize: 9 },
  restockBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${COLORS.warning}15`, borderWidth: 1, borderColor: `${COLORS.warning}30`, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md },
  restockBtnText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.warning, textTransform: 'uppercase', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS['3xl'], borderTopRightRadius: RADIUS['3xl'], padding: 28, gap: 18, borderTopWidth: 1, borderColor: `${COLORS.secondary}18` },
  modalTitle: { fontFamily: FONTS.serif, fontSize: 26, color: COLORS.text, fontWeight: '700' },
  modalField: { gap: 8, marginBottom: 12 },
  modalLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  modalInput: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 14, fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancelBtn: { flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.xl, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  modalCancelText: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.muted },
  modalConfirmBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 16, alignItems: 'center' },
  modalConfirmText: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.bg },
});
