import { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Plus, Phone, Mail, MapPin, Star } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';
import { haptic } from '../../lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  Fabric: COLORS.primary,
  Leather: COLORS.secondary,
  Accessories: COLORS.purple,
};

export default function Suppliers() {
  const { suppliers, addSupplier } = useStore();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', company: '', contactPerson: '', phone: '', email: '', address: '', category: 'Fabric' });
  const insets = useSafeAreaInsets();

  const filtered = suppliers.filter(s =>
    s.company.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newSupplier.name || !newSupplier.company) return;
    addSupplier({ ...newSupplier, id: `s-${Date.now()}`, rating: 4.0 });
    setShowAddModal(false);
    setNewSupplier({ name: '', company: '', contactPerson: '', phone: '', email: '', address: '', category: 'Fabric' });
    haptic('success');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Suppliers</Text>
          <Text style={styles.subtitle}>{suppliers.length} active vendors</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
          <Plus size={16} color={COLORS.bg} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal vendors bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.vendorsBarWrap}
        contentContainerStyle={styles.vendorsBarContent}
      >
        {suppliers.map(s => {
          const color = CATEGORY_COLORS[s.category] || COLORS.muted;
          return (
            <View key={s.id} style={[styles.vendorChip, { borderColor: `${color}35` }]}>
              <View style={[styles.vendorChipAvatar, { backgroundColor: `${color}20` }]}>
                <Text style={[styles.vendorChipInitial, { color }]}>{s.company[0]}</Text>
              </View>
              <View style={styles.vendorChipInfo}>
                <Text style={styles.vendorChipName} numberOfLines={1}>{s.company}</Text>
                <View style={styles.vendorChipMeta}>
                  <Star size={8} color={COLORS.secondary} fill={COLORS.secondary} />
                  <Text style={styles.vendorChipRating}>{s.rating.toFixed(1)}</Text>
                  <View style={styles.vendorActiveDot} />
                  <Text style={styles.vendorActiveText}>Active</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.searchWrap}>
        <Search size={16} color={COLORS.muted} />
        <TextInput style={styles.searchInput} placeholder="Search suppliers..." placeholderTextColor={COLORS.muted} value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={s => s.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingBottom: 80 }}
        renderItem={({ item }) => {
          const color = CATEGORY_COLORS[item.category] || COLORS.muted;
          return (
            <View style={styles.supplierCard}>
              {/* Header row */}
              <View style={styles.supplierHeader}>
                <View style={[styles.supplierAvatar, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
                  <Text style={[styles.supplierAvatarText, { color }]}>{item.contactPerson[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supplierName}>{item.company}</Text>
                  <Text style={styles.supplierContact}>{item.name}</Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: `${color}15`, borderColor: `${color}25`, borderWidth: 1 }]}>
                  <Text style={[styles.categoryBadgeText, { color }]}>{item.category}</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.cardDivider} />

              {/* Contact details */}
              <View style={styles.supplierDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrap}><Phone size={12} color={COLORS.secondary} /></View>
                  <Text style={styles.detailText}>{item.phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrap}><Mail size={12} color={COLORS.secondary} /></View>
                  <Text style={styles.detailText}>{item.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrap}><MapPin size={12} color={COLORS.secondary} /></View>
                  <Text style={styles.detailText} numberOfLines={1}>{item.address}</Text>
                </View>
              </View>

              {/* Rating row */}
              <View style={styles.ratingRow}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={13} color={COLORS.secondary} fill={i <= Math.floor(item.rating) ? COLORS.secondary : 'none'} />
                ))}
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeText}>Verified Partner</Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Supplier</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn} activeOpacity={0.7}>
                <Text style={styles.modalCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {[
                { key: 'name', label: 'Full Name', placeholder: 'e.g. Ahmed Khan', keyboard: 'default' as const },
                { key: 'company', label: 'Company Name', placeholder: 'e.g. Tuscan Leather S.p.A', keyboard: 'default' as const },
                { key: 'contactPerson', label: 'Contact Person', placeholder: 'e.g. Sales Manager', keyboard: 'default' as const },
                { key: 'phone', label: 'Phone Number', placeholder: 'e.g. +92-300-1234567', keyboard: 'phone-pad' as const },
                { key: 'email', label: 'Email Address', placeholder: 'e.g. info@supplier.com', keyboard: 'email-address' as const },
                { key: 'address', label: 'Address', placeholder: 'City, Country', keyboard: 'default' as const },
              ].map(f => (
                <View key={f.key} style={styles.modalField}>
                  <Text style={styles.modalLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={`${COLORS.muted}55`}
                    keyboardType={f.keyboard}
                    autoCapitalize={f.keyboard === 'email-address' ? 'none' : 'words'}
                    value={newSupplier[f.key as keyof typeof newSupplier]}
                    onChangeText={v => setNewSupplier(p => ({ ...p, [f.key]: v }))}
                  />
                </View>
              ))}

              {/* Category Picker */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Category</Text>
                <View style={styles.categoryPicker}>
                  {['Fabric', 'Leather', 'Accessories'].map(cat => {
                    const col = CATEGORY_COLORS[cat] || COLORS.muted;
                    const active = newSupplier.category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoryOption, active && { backgroundColor: `${col}20`, borderColor: col }]}
                        onPress={() => setNewSupplier(p => ({ ...p, category: cat }))}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.categoryOptionText, { color: active ? col : COLORS.muted }]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)} activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd} activeOpacity={0.85}>
                <Text style={styles.confirmText}>Add Supplier</Text>
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
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: 20, marginBottom: 16, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 13, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  searchInput: { flex: 1, fontFamily: FONTS.sans, fontSize: 14, color: COLORS.text },
  supplierCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 0 },
  supplierHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  supplierAvatar: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  supplierAvatarText: { fontFamily: FONTS.serif, fontSize: 22, fontWeight: '700' },
  supplierName: { fontFamily: FONTS.sansBold, fontSize: 15, color: COLORS.text },
  supplierContact: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted, marginTop: 2 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.md },
  categoryBadgeText: { fontFamily: FONTS.mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 16 },
  supplierDetails: { gap: 10, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIconWrap: { width: 26, height: 26, borderRadius: 9, backgroundColor: `${COLORS.secondary}12`, alignItems: 'center', justifyContent: 'center' },
  detailText: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted, flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.secondary, marginLeft: 4, fontWeight: '700' },
  ratingBadge: { marginLeft: 'auto' as any, backgroundColor: `${COLORS.success}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  ratingBadgeText: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.success, textTransform: 'uppercase', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS['3xl'], borderTopRightRadius: RADIUS['3xl'], padding: 28, gap: 18, borderTopWidth: 1, borderColor: `${COLORS.secondary}18` },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontFamily: FONTS.serif, fontSize: 26, color: COLORS.text, fontWeight: '700' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.muted}18`, alignItems: 'center', justifyContent: 'center' },
  modalCloseTxt: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted },
  modalField: { gap: 8, marginBottom: 14 },
  modalLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 2 },
  modalInput: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 14, fontFamily: FONTS.sans, fontSize: 14, color: COLORS.text },
  categoryPicker: { flexDirection: 'row', gap: 10 },
  categoryOption: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.lg, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  categoryOptionText: { fontFamily: FONTS.sansBold, fontSize: 12 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.xl, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cancelText: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.muted },
  confirmBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 16, alignItems: 'center' },
  confirmText: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.bg },
  // Vendors horizontal bar
  vendorsBarWrap: { marginBottom: 4 },
  vendorsBarContent: { paddingHorizontal: 20, gap: 10 },
  vendorChip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, minWidth: 160 },
  vendorChipAvatar: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  vendorChipInitial: { fontFamily: FONTS.serif, fontSize: 14, fontWeight: '700' },
  vendorChipInfo: { flex: 1 },
  vendorChipName: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.text },
  vendorChipMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  vendorChipRating: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.secondary },
  vendorActiveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.success },
  vendorActiveText: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.success, textTransform: 'uppercase', letterSpacing: 0.5 },
});
