import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Megaphone, Plus, Target, Users, Zap, Mail, MessageSquare, Instagram, X, CheckSquare } from 'lucide-react-native';
import { useStore, Campaign } from '../../store/useStore';
import { COLORS, FONTS, RADIUS } from '../../theme';
import { haptic } from '../../lib/utils';

const CAMPAIGN_COLORS: Record<string, string> = {
  Instagram: COLORS.pink,
  Email: COLORS.success,
  SMS: COLORS.warning,
  Web: COLORS.purple,
};

const CHANNEL_ICONS: Record<string, any> = {
  Instagram,
  Email: Mail,
  SMS: MessageSquare,
  Web: Megaphone,
};

export default function Marketing({ navigation }: any) {
  const { campaigns, addCampaign, setToast } = useStore();
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Instagram' as Campaign['type'], reach: '' });

  const handleSubmit = () => {
    if (!formData.name) return;
    haptic('medium');
    const newCampaign: Campaign = {
      id: `C-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      name: formData.name,
      status: 'Draft',
      reach: formData.reach || '0',
      ctr: '0%',
      type: formData.type,
      icon: formData.type,
      color: CAMPAIGN_COLORS[formData.type],
    };
    addCampaign(newCampaign);
    setShowModal(false);
    setFormData({ name: '', type: 'Instagram', reach: '' });
    setToast('Campaign Draft Created');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Marketing</Text>
          <Text style={styles.subtitle}>Growth & Influence</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { haptic('light'); setShowModal(true); }} activeOpacity={0.85}>
          <Plus size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Target Audience Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewCol}>
            <View style={styles.overviewLabelRow}>
              <Target size={16} color={COLORS.primary} />
              <Text style={[styles.overviewLabelText, { color: COLORS.primary }]}>Target Reach</Text>
            </View>
            <Text style={styles.overviewValue}>24.8k</Text>
            <Text style={styles.overviewSub}>Active Segments</Text>
          </View>
          <View style={[styles.overviewCol, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.06)', paddingLeft: 20 }]}>
            <View style={styles.overviewLabelRow}>
              <Users size={16} color={COLORS.secondary} />
              <Text style={[styles.overviewLabelText, { color: COLORS.secondary }]}>Acquisition</Text>
            </View>
            <Text style={styles.overviewValue}>+12%</Text>
            <Text style={styles.overviewSub}>MoM Growth</Text>
          </View>
        </View>

        {/* Campaign List */}
        <Text style={styles.sectionTitle}>Campaign Flow</Text>
        {campaigns.map((camp) => {
          const Icon = CHANNEL_ICONS[camp.type] || Megaphone;
          const color = camp.color || COLORS.muted;
          return (
            <View key={camp.id} style={styles.campaignCard}>
              <View style={[styles.campIcon, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
                <Icon size={20} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.campName}>{camp.name}</Text>
                <View style={styles.campMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: camp.status === 'Active' ? `${COLORS.primary}18` : `${COLORS.muted}18` }]}>
                    <Text style={[styles.statusText, { color: camp.status === 'Active' ? COLORS.primary : COLORS.muted }]}>{camp.status}</Text>
                  </View>
                  <Text style={styles.reachText}>{camp.reach} Reach</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.ctrLabel}>CTR</Text>
                <Text style={styles.ctrValue}>{camp.ctr}</Text>
              </View>
            </View>
          );
        })}

        {/* AI Marketing Banner */}
        <View style={styles.aiCard}>
          <View style={styles.aiIconWrap}>
            <Zap size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.aiTitle}>Create Smart{'\n'}Segments</Text>
          <Text style={styles.aiDesc}>Let Gargi analyze previous purchase history to identify high-intent VIP customers for your next collection.</Text>
          <TouchableOpacity style={styles.aiBtn} onPress={() => navigation?.navigate?.('AIIntelligence')} activeOpacity={0.85}>
            <Text style={styles.aiBtnText}>Open AI Lab</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Campaign Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>New Broadcast</Text>
                <Text style={styles.modalSub}>Define your outreach strategy</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={20} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Campaign Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholderTextColor={COLORS.muted}
                  placeholder="e.g. Winter Luxury Drop"
                  value={formData.name}
                  onChangeText={v => setFormData(p => ({ ...p, name: v }))}
                />
              </View>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Channel</Text>
                <View style={styles.channelGrid}>
                  {(['Instagram', 'Email', 'SMS', 'Web'] as Campaign['type'][]).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.channelBtn, formData.type === type && { backgroundColor: `${COLORS.primary}18`, borderColor: COLORS.primary }]}
                      onPress={() => setFormData(p => ({ ...p, type }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.channelBtnText, { color: formData.type === type ? COLORS.primary : COLORS.muted }]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Initial Target Reach</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholderTextColor={COLORS.muted}
                  placeholder="e.g. 15k"
                  value={formData.reach}
                  onChangeText={v => setFormData(p => ({ ...p, reach: v }))}
                />
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.deployBtn} onPress={handleSubmit} activeOpacity={0.85}>
              <CheckSquare size={16} color="#000" />
              <Text style={styles.deployBtnText}>Deploy Campaign</Text>
            </TouchableOpacity>
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
  addBtn: { width: 44, height: 44, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  overviewCard: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 24, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  overviewCol: { flex: 1, gap: 4 },
  overviewLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  overviewLabelText: { fontFamily: FONTS.mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  overviewValue: { fontFamily: FONTS.mono, fontSize: 28, color: COLORS.text, fontWeight: '700' },
  overviewSub: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  sectionTitle: { fontFamily: FONTS.serif, fontSize: 20, color: COLORS.text, paddingHorizontal: 24, marginBottom: 12 },
  campaignCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 20, marginBottom: 12, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  campIcon: { width: 48, height: 48, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  campName: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.text, marginBottom: 6 },
  campMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontFamily: FONTS.mono, fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  reachText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted },
  ctrLabel: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase' },
  ctrValue: { fontFamily: FONTS.mono, fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  aiCard: { marginHorizontal: 20, marginTop: 8, marginBottom: 24, backgroundColor: `${COLORS.primary}0a`, borderRadius: RADIUS['3xl'], padding: 28, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: `${COLORS.primary}22` },
  aiIconWrap: { width: 64, height: 64, backgroundColor: `${COLORS.primary}18`, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontFamily: FONTS.serif, fontSize: 24, color: COLORS.text, textAlign: 'center', lineHeight: 32 },
  aiDesc: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },
  aiBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: RADIUS.xl, marginTop: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  aiBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: '#000', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['3xl'], padding: 24, gap: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontFamily: FONTS.serif, fontSize: 26, color: COLORS.text },
  modalSub: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  closeBtn: { width: 36, height: 36, backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  modalField: { gap: 6, marginBottom: 12 },
  modalLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  modalInput: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.mono, fontSize: 13, color: COLORS.text },
  channelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  channelBtn: { flex: 1, minWidth: '45%', paddingVertical: 12, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: COLORS.bg, alignItems: 'center' },
  channelBtnText: { fontFamily: FONTS.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  deployBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 16, marginTop: 4 },
  deployBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: '#000', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
});
