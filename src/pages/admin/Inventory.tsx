import { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Plus, AlertTriangle, Zap, Package } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';
import { haptic } from '../../lib/utils';

export default function Inventory() {
  const { inventory, suppliers, orderSupplierRestock, addProduct } = useStore();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '', image: '' });
  const insets = useSafeAreaInsets();

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
          <Plus size={16} color="#000" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Active Vendors */}
      <Text style={styles.sectionLabel}>Active Vendors</Text>
      <FlatList
        horizontal
        data={suppliers}
        keyExtractor={s => s.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <View style={styles.vendorCard}>
            <Text style={styles.vendorName} numberOfLines={1}>{item.company}</Text>
            <Text style={styles.vendorCategory}>{item.category}</Text>
            <View style={styles.vendorRating}>
              <Zap size={10} color={COLORS.primary} fill={COLORS.primary} />
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
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 80 }}
        renderItem={({ item }) => {
          const stockColor = getStockColor(item.stock);
          const needsRestock = item.stock < 10;
          return (
            <View style={styles.productRow}>
              <View style={[styles.stockIndicator, { backgroundColor: `${stockColor}22`, borderColor: `${stockColor}44` }]}>
                <Package size={14} color={stockColor} />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productSku}>{item.sku} · {item.category}</Text>
                <View style={styles.productMeta}>
                  <Text style={styles.productPrice}>${item.price}</Text>
                  <View style={[styles.stockPill, { backgroundColor: `${stockColor}18` }]}>
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
                { key: 'price', label: 'Price (USD)', keyboardType: 'numeric' },
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontFamily: FONTS.serif, fontSize: 30, color: COLORS.text },
  subtitle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.lg, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  addBtnText: { fontFamily: FONTS.sansBold, fontSize: 12, color: '#000' },
  sectionLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 3, paddingHorizontal: 24, marginBottom: 8 },
  vendorCard: { width: 150, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: 12, gap: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  vendorName: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.text },
  vendorCategory: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase' },
  vendorRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  vendorRatingText: { fontFamily: FONTS.sansBold, fontSize: 10, color: COLORS.primary },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: 20, marginBottom: 12, borderRadius: RADIUS.xl, paddingHorizontal: 14, paddingVertical: 11, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  searchInput: { flex: 1, fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  stockIndicator: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  productInfo: { flex: 1, gap: 3 },
  productName: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.text },
  productSku: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  productPrice: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.primary },
  stockPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm },
  stockText: { fontFamily: FONTS.mono, fontSize: 9 },
  restockBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${COLORS.warning}18`, borderWidth: 1, borderColor: `${COLORS.warning}30`, paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIUS.md },
  restockBtnText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.warning, textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS['3xl'], borderTopRightRadius: RADIUS['3xl'], padding: 24, gap: 16, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  modalTitle: { fontFamily: FONTS.serif, fontSize: 24, color: COLORS.text },
  modalField: { gap: 6, marginBottom: 12 },
  modalLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  modalInput: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancelBtn: { flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.xl, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  modalCancelText: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.muted },
  modalConfirmBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 14, alignItems: 'center' },
  modalConfirmText: { fontFamily: FONTS.sansBold, fontSize: 13, color: '#000' },
});
