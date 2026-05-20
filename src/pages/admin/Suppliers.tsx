import { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Plus, Phone, Mail, MapPin, Star } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';
import { haptic } from '../../lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  Fabric: COLORS.primary,
  Leather: COLORS.warning,
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
          <Plus size={16} color="#000" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Search size={16} color={COLORS.muted} />
        <TextInput style={styles.searchInput} placeholder="Search suppliers..." placeholderTextColor={COLORS.muted} value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={s => s.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 80 }}
        renderItem={({ item }) => {
          const color = CATEGORY_COLORS[item.category] || COLORS.muted;
          return (
            <View style={styles.supplierCard}>
              <View style={styles.supplierHeader}>
                <View style={[styles.supplierAvatar, { backgroundColor: `${color}18` }]}>
                  <Text style={[styles.supplierAvatarText, { color }]}>{item.contactPerson[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supplierName}>{item.company}</Text>
                  <Text style={styles.supplierContact}>{item.name}</Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: `${color}18` }]}>
                  <Text style={[styles.categoryBadgeText, { color }]}>{item.category}</Text>
                </View>
              </View>
              <View style={styles.supplierDetails}>
                <View style={styles.detailRow}><Phone size={12} color={COLORS.muted} /><Text style={styles.detailText}>{item.phone}</Text></View>
                <View style={styles.detailRow}><Mail size={12} color={COLORS.muted} /><Text style={styles.detailText}>{item.email}</Text></View>
                <View style={styles.detailRow}><MapPin size={12} color={COLORS.muted} /><Text style={styles.detailText} numberOfLines={1}>{item.address}</Text></View>
              </View>
              <View style={styles.ratingRow}>
                {[1,2,3,4,5].map(i => <Star key={i} size={12} color={COLORS.warning} fill={i <= Math.floor(item.rating) ? COLORS.warning : 'none'} />)}
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Supplier</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {[
                { key: 'name', label: 'Full Name' },
                { key: 'company', label: 'Company Name' },
                { key: 'contactPerson', label: 'Contact Person' },
                { key: 'phone', label: 'Phone' },
                { key: 'email', label: 'Email' },
                { key: 'address', label: 'Address' },
              ].map(f => (
                <View key={f.key} style={styles.modalField}>
                  <Text style={styles.modalLabel}>{f.label}</Text>
                  <TextInput style={styles.modalInput} placeholderTextColor={COLORS.muted} value={newSupplier[f.key as keyof typeof newSupplier]} onChangeText={v => setNewSupplier(p => ({ ...p, [f.key]: v }))} />
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)} activeOpacity={0.7}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd} activeOpacity={0.85}><Text style={styles.confirmText}>Add Supplier</Text></TouchableOpacity>
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
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: 20, marginBottom: 12, borderRadius: RADIUS.xl, paddingHorizontal: 14, paddingVertical: 11, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  searchInput: { flex: 1, fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text },
  supplierCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  supplierHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supplierAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  supplierAvatarText: { fontFamily: FONTS.serif, fontSize: 20 },
  supplierName: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.text },
  supplierContact: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  categoryBadgeText: { fontFamily: FONTS.mono, fontSize: 8, textTransform: 'uppercase', letterSpacing: 1 },
  supplierDetails: { gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted, flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.warning, marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS['3xl'], borderTopRightRadius: RADIUS['3xl'], padding: 24, gap: 16, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  modalTitle: { fontFamily: FONTS.serif, fontSize: 24, color: COLORS.text },
  modalField: { gap: 6, marginBottom: 12 },
  modalLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  modalInput: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.xl, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cancelText: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.muted },
  confirmBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 14, alignItems: 'center' },
  confirmText: { fontFamily: FONTS.sansBold, fontSize: 13, color: '#000' },
});
