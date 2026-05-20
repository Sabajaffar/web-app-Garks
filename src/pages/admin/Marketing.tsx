import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Megaphone, Plus, Target, Users, Zap, Mail, MessageSquare, Instagram, X, CheckSquare, BrainCircuit } from 'lucide-react-native';
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
  const { campaigns, addCampaign, setToast, gargiProactiveInsight } = useStore();
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Instagram' as Campaign['type'], reach: '' });

  const insight = gargiProactiveInsight('marketing');

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
          <Plus size={20} color={COLORS.bg} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Gargi Proactive Insight */}
        <View style={styles.gargiInsightCard}>
          <View style={styles.gargiInsightHeader}>
            <View style={styles.gargiInsightIcon}>
              <BrainCircuit size={14} color={COLORS.secondary} />
            </View>
            <Text style={styles.gargiInsightTitle}>Gargi Intelligence</Text>
          </View>
          <Text style={styles.gargiInsightText}>{insight}</Text>
          <TouchableOpacity style={styles.gargiInsightBtn} onPress={() => navigation?.navigate?.('AIIntelligence')} activeOpacity={0.8}>
            <Zap size={10} color={COLORS.bg} />
            <Text style={styles.gargiInsightBtnText}>Open AI Lab</Text>
          </TouchableOpacity>
        </View>

        {/* Target Audience Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewCol}>
            <View style={styles.overviewLabelRow}>
              <Target size={16} color={COLORS.secondary} />
              <Text style={[styles.overviewLabelText, { color: COLORS.secondary }]}>Target Reach</Text>
            </View>
            <Text style={styles.overviewValue}>24.8k</Text>
            <Text style={styles.overviewSub}>Active Segments</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewCol}>
            <View style={styles.overviewLabelRow}>
              <Users size={16} color={COLORS.primary} />
              <Text style={[styles.overviewLabelText, { color: COLORS.primary }]}>Acquisition</Text>
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
              <View style={[styles.campIcon, { backgroundColor: `${color}15`, borderColor: `${color}25` }]}>
                <Icon size={22} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.campName}>{camp.name}</Text>
                <View style={styles.campMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: camp.status === 'Active' ? `${COLORS.secondary}18` : `${COLORS.muted}18` }]}>
                    <Text style={[styles.statusText, { color: camp.status === 'Active' ? COLORS.secondary : COLORS.muted }]}>{camp.status}</Text>
                  </View>
                  <Text style={styles.reachText}>{camp.reach} reach</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.ctrLabel}>CTR</Text>
                <Text style={styles.ctrValue}>{camp.ctr}</Text>
              </View>
            </View>
          );
        })}

        {/* AI Marketing Banner */}
        <View style={styles.aiCard}>
          <View style={styles.aiIconWrap}>
            <Zap size={32} color={COLORS.secondary} />
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
                      style={[styles.channelBtn, formData.type === type && { backgroundColor: `${COLORS.secondary}18`, borderColor: COLORS.secondary }]}
                      onPress={() => setFormData(p => ({ ...p, type }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.channelBtnText, { color: formData.type === type ? COLORS.secondary : COLORS.muted }]}>{type}</Text>
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
              <CheckSquare size={16} color={COLORS.bg} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { fontFamily: FONTS.serif, fontSize: 34, color: COLORS.text, fontWeight: '700' },
  subtitle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 3 },
  addBtn: { width: 46, height: 46, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  gargiInsightCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: `${COLORS.secondary}0d`, borderRadius: RADIUS['2xl'], padding: 18, borderWidth: 1, borderColor: `${COLORS.secondary}22`, gap: 12 },
  gargiInsightHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gargiInsightIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: `${COLORS.secondary}18`, alignItems: 'center', justifyContent: 'center' },
  gargiInsightTitle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  gargiInsightText: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text, lineHeight: 20 },
  gargiInsightBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.secondary, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md },
  gargiInsightBtnText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.bg, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  overviewCard: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 28, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  overviewCol: { flex: 1, gap: 5 },
  overviewDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 20 },
  overviewLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  overviewLabelText: { fontFamily: FONTS.mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  overviewValue: { fontFamily: FONTS.serif, fontSize: 30, color: COLORS.text, fontWeight: '700' },
  overviewSub: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  sectionTitle: { fontFamily: FONTS.serif, fontSize: 22, color: COLORS.text, paddingHorizontal: 24, marginBottom: 14, fontWeight: '700' },
  campaignCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 20, marginBottom: 12, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  campIcon: { width: 52, height: 52, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  campName: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.text, marginBottom: 7 },
  campMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontFamily: FONTS.mono, fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  reachText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted },
  ctrLabel: { fontFamily: FONTS.mono, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase' },
  ctrValue: { fontFamily: FONTS.mono, fontSize: 15, color: COLORS.secondary, fontWeight: '700' },
  aiCard: { marginHorizontal: 20, marginTop: 8, marginBottom: 24, backgroundColor: `${COLORS.secondary}0a`, borderRadius: RADIUS['3xl'], padding: 30, alignItems: 'center', gap: 16, borderWidth: 1, borderColor: `${COLORS.secondary}22` },
  aiIconWrap: { width: 68, height: 68, backgroundColor: `${COLORS.secondary}18`, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${COLORS.secondary}22` },
  aiTitle: { fontFamily: FONTS.serif, fontSize: 26, color: COLORS.text, textAlign: 'center', lineHeight: 34, fontWeight: '700' },
  aiDesc: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 21 },
  aiBtn: { backgroundColor: COLORS.secondary, paddingHorizontal: 36, paddingVertical: 14, borderRadius: RADIUS.xl, marginTop: 4, shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  aiBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.bg, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['3xl'], padding: 26, gap: 18, borderWidth: 1, borderColor: `${COLORS.secondary}18` },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontFamily: FONTS.serif, fontSize: 28, color: COLORS.text, fontWeight: '700' },
  modalSub: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 3 },
  closeBtn: { width: 38, height: 38, backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  modalField: { gap: 8, marginBottom: 12 },
  modalLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  modalInput: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 14, fontFamily: FONTS.mono, fontSize: 13, color: COLORS.text },
  channelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  channelBtn: { flex: 1, minWidth: '45%', paddingVertical: 13, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: COLORS.bg, alignItems: 'center' },
  channelBtnText: { fontFamily: FONTS.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  deployBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 17, marginTop: 4 },
  deployBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.bg, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
});
