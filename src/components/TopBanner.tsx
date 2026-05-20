import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { Zap, X, Clock, Trash2, Megaphone, CheckCircle2 } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS } from '../theme';
import { API_BASE } from '../config';

export default function TopBanner() {
  const { saleActive, saleBannerDismissed, setSaleBannerDismissed, endSale, launchSale, saleDiscount } = useStore();
  const [showMiniMenu, setShowMiniMenu] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignExecuted, setCampaignExecuted] = useState(false);
  const [targetAudience, setTargetAudience] = useState('Wishlist Customers');
  const [estimatedReach, setEstimatedReach] = useState('1,200 users');
  const bannerOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (saleActive && !saleBannerDismissed) {
      Animated.timing(bannerOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    } else {
      Animated.timing(bannerOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
  }, [saleActive, saleBannerDismissed]);

  useEffect(() => {
    if (targetAudience === 'Wishlist Customers') setEstimatedReach('1,200 users');
    else if (targetAudience === 'All Customers') setEstimatedReach('10,900 users');
    else if (targetAudience === 'Inactive Shoppers') setEstimatedReach('3,450 users');
    else if (targetAudience === 'Repeat Buyers') setEstimatedReach('2,100 users');
  }, [targetAudience]);

  const handleExecuteCampaign = async () => {
    try {
      await fetch(`${API_BASE}/api/orchestrator/approve-marketing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignType: 'Send promotional push notification to customers', targetAudience, estimatedReach }),
      });
    } catch {}
    setShowCampaignModal(false);
    setCampaignExecuted(true);
    setTimeout(() => setCampaignExecuted(false), 2000);
  };

  return (
    <>
      {/* Flash Sale Banner */}
      {saleActive && !saleBannerDismissed && (
        <Animated.View style={[styles.banner, { opacity: bannerOpacity }]}>
          <View style={styles.bannerLeft}>
            <View style={styles.bannerIcon}>
              <Zap size={20} color="#000" fill="#000" />
            </View>
            <View>
              <Text style={styles.bannerLabel}>Active Flash Sale</Text>
              <Text style={styles.bannerSub}>{saleDiscount}% off — Tap to manage</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setSaleBannerDismissed(true)} style={styles.bannerClose} activeOpacity={0.7}>
            <X size={16} color="#000" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Floating Sale Icon (when banner dismissed) */}
      {saleActive && saleBannerDismissed && (
        <View style={styles.floatingWrap}>
          <TouchableOpacity style={styles.floatingBtn} onPress={() => setShowMiniMenu(v => !v)} activeOpacity={0.85}>
            <Zap size={20} color="#000" fill="#000" />
          </TouchableOpacity>
          {showMiniMenu && (
            <View style={styles.miniMenu}>
              <TouchableOpacity style={styles.miniMenuItem} onPress={() => { setSaleBannerDismissed(false); setShowMiniMenu(false); }} activeOpacity={0.7}>
                <Zap size={14} color={COLORS.primary} />
                <Text style={styles.miniMenuText}>Maximize Banner</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.miniMenuItem} onPress={() => { launchSale(saleDiscount, 12); setShowMiniMenu(false); }} activeOpacity={0.7}>
                <Clock size={14} color={COLORS.muted} />
                <Text style={styles.miniMenuText}>Extend +12h</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.miniMenuItem} onPress={() => { setShowCampaignModal(true); setShowMiniMenu(false); }} activeOpacity={0.7}>
                <Megaphone size={14} color={COLORS.primary} />
                <Text style={[styles.miniMenuText, { color: COLORS.primary, fontWeight: '700' }]}>Launch Campaign</Text>
              </TouchableOpacity>
              <View style={styles.miniMenuDivider} />
              <TouchableOpacity style={styles.miniMenuItem} onPress={() => { endSale(); setShowMiniMenu(false); }} activeOpacity={0.7}>
                <Trash2 size={14} color={COLORS.danger} />
                <Text style={[styles.miniMenuText, { color: COLORS.danger, fontWeight: '700' }]}>End Sale</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Campaign Modal */}
      <Modal visible={showCampaignModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Megaphone size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Launch Marketing Campaign</Text>
            <Text style={styles.modalSub}>Sale active · multi-channel boost</Text>

            <View style={styles.recommendBox}>
              <Text style={styles.recommendLabel}>Agent Recommendation</Text>
              <Text style={styles.recommendText}>"Active sale detected. Initiating multi-channel marketing campaign to highlight low-stock items without duplicate discounting."</Text>
            </View>

            <View style={styles.preferenceSection}>
              <Text style={styles.prefLabel}>Target Audience</Text>
              {['Wishlist Customers', 'All Customers', 'Inactive Shoppers', 'Repeat Buyers'].map(aud => (
                <TouchableOpacity
                  key={aud}
                  style={[styles.audienceBtn, targetAudience === aud && styles.audienceBtnActive]}
                  onPress={() => setTargetAudience(aud)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.audienceBtnText, targetAudience === aud && { color: COLORS.primary }]}>{aud}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.reachDisplay}>
                <Text style={styles.reachText}>{estimatedReach}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.approveBtn} onPress={handleExecuteCampaign} activeOpacity={0.85}>
              <Megaphone size={16} color="#000" />
              <Text style={styles.approveBtnText}>Approve & Launch Campaign</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCampaignModal(false)} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Campaign Executed Overlay */}
      {campaignExecuted && (
        <View style={styles.executedOverlay}>
          <CheckCircle2 size={56} color={COLORS.primary} />
          <Text style={styles.executedTitle}>Campaign Deployed!</Text>
          <Text style={styles.executedSub}>Redirecting to AI Intelligence...</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', top: 56, left: 24, right: 24, zIndex: 100, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10 },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerIcon: { width: 38, height: 38, backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  bannerLabel: { fontFamily: FONTS.mono, fontSize: 10, color: '#000', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  bannerSub: { fontFamily: FONTS.sans, fontSize: 12, color: 'rgba(0,0,0,0.75)', marginTop: 2 },
  bannerClose: { padding: 8 },
  floatingWrap: { position: 'absolute', top: 60, right: 24, zIndex: 100 },
  floatingBtn: { width: 48, height: 48, backgroundColor: COLORS.primary, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 10 },
  miniMenu: { position: 'absolute', top: 56, right: 0, width: 200, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: 8, borderWidth: 1, borderColor: `${COLORS.primary}22`, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12, gap: 2 },
  miniMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: RADIUS.lg },
  miniMenuText: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.text },
  miniMenuDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['3xl'], padding: 28, gap: 14, borderWidth: 1, borderColor: `${COLORS.primary}33`, alignItems: 'center' },
  modalIconWrap: { width: 56, height: 56, backgroundColor: `${COLORS.primary}18`, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontFamily: FONTS.serifItalic, fontSize: 20, color: COLORS.text, textAlign: 'center' },
  modalSub: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  recommendBox: { width: '100%', backgroundColor: `${COLORS.primary}0a`, borderRadius: RADIUS.xl, padding: 14, borderWidth: 1, borderColor: `${COLORS.primary}22`, gap: 6 },
  recommendLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', fontWeight: '700' },
  recommendText: { fontFamily: FONTS.serifItalic, fontSize: 12, color: COLORS.text, lineHeight: 18 },
  preferenceSection: { width: '100%', gap: 8 },
  prefLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  audienceBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: COLORS.bg },
  audienceBtnActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  audienceBtnText: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted },
  reachDisplay: { backgroundColor: `${COLORS.primary}12`, borderRadius: RADIUS.lg, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: `${COLORS.primary}22` },
  reachText: { fontFamily: FONTS.mono, fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  approveBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 16 },
  approveBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: '#000', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  cancelBtn: { width: '100%', backgroundColor: COLORS.bg, borderRadius: RADIUS.xl, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cancelBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  executedOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', gap: 16 },
  executedTitle: { fontFamily: FONTS.serifItalic, fontSize: 22, color: COLORS.text },
  executedSub: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 3 },
});
