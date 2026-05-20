import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User, Shield, Moon, Globe,
  Bell, FileLock2, LogOut, ChevronRight,
  Camera, RefreshCw, Lock, Sparkles
} from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS } from '../theme';
import { haptic } from '../lib/utils';

export default function Profile({ navigation }: any) {
  const { user, mode, setMode, logout, adminPassword, setAdminPassword, adminSecurityCode, setAdminSecurityCode, lockAdmin, setToast } = useStore();
  const insets = useSafeAreaInsets();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);
  const [newPassword, setNewPassword] = useState(adminPassword);
  const [newSecurityCode, setNewSecurityCode] = useState(adminSecurityCode);

  const handleModeSwitch = () => {
    haptic('medium');
    const newMode = mode === 'customer' ? 'admin' : 'customer';
    setMode(newMode);
  };

  const handleUpdateSecurity = () => {
    haptic('medium');
    setAdminPassword(newPassword);
    setAdminSecurityCode(newSecurityCode);
    setIsEditingSecurity(false);
    setToast('Security Protocols Updated');
  };

  const handleLock = () => {
    haptic('heavy');
    lockAdmin();
    setToast('Admin Terminal Locked');
  };

  const confirmLogout = () => {
    haptic('heavy');
    logout();
  };

  const menuItems = [
    { label: 'Concierge Assistant', icon: Sparkles, value: 'Personalized', onPress: () => {} },
    { label: 'Notifications', icon: Bell, value: notificationsEnabled ? 'Active' : 'Muted', onPress: () => { haptic('light'); setNotificationsEnabled(v => !v); } },
    { label: 'Appearance', icon: Moon, value: 'Midnight Navy', onPress: () => haptic('light') },
    { label: 'Language', icon: Globe, value: 'English (UK)', onPress: () => {} },
    { label: 'Privacy Policy', icon: FileLock2, onPress: () => {} },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={48} strokeWidth={1} color={`${COLORS.muted}44`} />
              </View>
            )}
            <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
              <Camera size={16} strokeWidth={2} color={COLORS.bg} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.userRoleRow}>
            <Text style={styles.userRole}>{user?.isAdmin ? 'GarKS Executive' : 'Honorary House Member'}</Text>
            <View style={styles.roleDot} />
            <Text style={styles.userPoints}>{user?.points || 0} Points</Text>
          </View>
        </View>

        {/* Admin Mode Switcher */}
        {user?.isAdmin && (
          <View style={styles.modeSwitchCard}>
            <View style={styles.modeSwitchLeft}>
              <View style={styles.modeSwitchIcon}>
                <RefreshCw size={22} strokeWidth={1.5} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.modeSwitchTitle}>{mode === 'admin' ? 'Customer Experience' : 'Executive Dashboard'}</Text>
                <Text style={styles.modeSwitchSub}>{mode === 'admin' ? 'View storefront' : 'Access core ops'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.modeSwitchBtn} onPress={handleModeSwitch} activeOpacity={0.85}>
              <Text style={styles.modeSwitchBtnText}>{mode === 'admin' ? 'View' : 'Restore'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, i) => (
              <TouchableOpacity key={i} style={[styles.menuRow, i < menuItems.length - 1 && styles.menuRowBorder]} onPress={item.onPress} activeOpacity={0.7}>
                <View style={styles.menuRowLeft}>
                  <View style={styles.menuIcon}>
                    <item.icon size={20} strokeWidth={1.5} color={COLORS.muted} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <View style={styles.menuRowRight}>
                  {item.value && (
                    <Text style={styles.menuValue}>{item.value}</Text>
                  )}
                  <ChevronRight size={16} strokeWidth={1} color={`${COLORS.muted}44`} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security Admin */}
        {user?.isAdmin && mode === 'admin' && (
          <View style={styles.section}>
            <View style={styles.securityHeader}>
              <Text style={styles.sectionTitle}>Executive Security</Text>
              <TouchableOpacity style={styles.lockBtn} onPress={handleLock} activeOpacity={0.8}>
                <FileLock2 size={14} color={COLORS.primary} />
                <Text style={styles.lockBtnText}>Lock Terminal</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.securityCard}>
              {/* Password */}
              <View style={styles.securityField}>
                <View style={styles.securityFieldHeader}>
                  <Text style={styles.securityFieldLabel}>Encrypted Auth Code</Text>
                  {!isEditingSecurity ? (
                    <TouchableOpacity onPress={() => setIsEditingSecurity(true)} activeOpacity={0.7}>
                      <Text style={styles.recalibrateBtn}>Recalibrate</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.securityBtnRow}>
                      <TouchableOpacity onPress={() => { setIsEditingSecurity(false); setNewPassword(adminPassword); setNewSecurityCode(adminSecurityCode); }} activeOpacity={0.7}>
                        <Text style={styles.revokeBtn}>Revoke</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleUpdateSecurity} activeOpacity={0.8}>
                        <Text style={styles.commitBtn}>Commit</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {isEditingSecurity ? (
                  <TextInput
                    style={styles.securityInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="New Password"
                    placeholderTextColor={`${COLORS.muted}44`}
                    secureTextEntry
                  />
                ) : (
                  <View style={styles.maskedField}>
                    <Text style={styles.maskedText}>●●●●●●●●●●</Text>
                    <Lock size={18} strokeWidth={1} color={`${COLORS.muted}22`} />
                  </View>
                )}
              </View>

              {/* Security Code */}
              <View style={[styles.securityField, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 24 }]}>
                <Text style={styles.securityFieldLabel}>Secondary Key</Text>
                {isEditingSecurity ? (
                  <TextInput
                    style={styles.securityInput}
                    value={newSecurityCode}
                    onChangeText={setNewSecurityCode}
                    placeholder="New Security Code"
                    placeholderTextColor={`${COLORS.muted}44`}
                    secureTextEntry
                  />
                ) : (
                  <View style={styles.maskedField}>
                    <Text style={styles.maskedText}>●●●●●●●●●●</Text>
                    <Shield size={18} strokeWidth={1} color={`${COLORS.muted}22`} />
                  </View>
                )}
                <Text style={styles.securityNote}>Calibrating these protocols will sync identity with +92 333 3333333.</Text>
              </View>
            </View>
          </View>
        )}

        {/* Logout */}
        <View style={[styles.section, { paddingBottom: 16 }]}>
          {!showLogoutConfirm ? (
            <TouchableOpacity style={styles.logoutBtn} onPress={() => { haptic('light'); setShowLogoutConfirm(true); }} activeOpacity={0.8}>
              <LogOut size={22} strokeWidth={1.5} color={`${COLORS.danger}cc`} />
              <Text style={styles.logoutBtnText}>Terminate Session</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.logoutConfirm}>
              <Text style={styles.logoutConfirmText}>Confirm evacuation of ateliers?</Text>
              <View style={styles.logoutConfirmBtns}>
                <TouchableOpacity style={styles.stayBtn} onPress={() => setShowLogoutConfirm(false)} activeOpacity={0.7}>
                  <Text style={styles.stayBtnText}>Stay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exitBtn} onPress={confirmLogout} activeOpacity={0.85}>
                  <Text style={styles.exitBtnText}>Exit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider}>
            <View style={styles.footerLine} />
            <Text style={styles.footerBrand}>GarKS</Text>
            <View style={styles.footerLine} />
          </View>
          <Text style={styles.footerTagline}>Architecture. Style. Intelligence.</Text>
          <Text style={styles.footerVersion}>Cloud Production V2.8.4-B</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  profileHeader: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 10 },
  avatarWrap: { position: 'relative', marginBottom: 6 },
  avatarImg: { width: 120, height: 120, borderRadius: 42, borderWidth: 1, borderColor: `${COLORS.secondary}44` },
  avatarPlaceholder: { width: 120, height: 120, backgroundColor: COLORS.card, borderRadius: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${COLORS.secondary}22` },
  cameraBtn: { position: 'absolute', bottom: -4, right: -4, backgroundColor: COLORS.secondary, padding: 10, borderRadius: RADIUS.lg, borderWidth: 3, borderColor: COLORS.bg },
  userName: { fontFamily: FONTS.serifItalic, fontSize: 28, color: COLORS.text, marginTop: 8 },
  userRoleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userRole: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 3 },
  roleDot: { width: 6, height: 6, backgroundColor: COLORS.secondary, borderRadius: 3 },
  userPoints: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.secondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  modeSwitchCard: { marginHorizontal: 24, marginBottom: 24, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: `${COLORS.primary}18` },
  modeSwitchLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  modeSwitchIcon: { width: 52, height: 52, backgroundColor: COLORS.bg, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  modeSwitchTitle: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  modeSwitchSub: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  modeSwitchBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.full, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  modeSwitchBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: '#000', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontFamily: FONTS.serifItalic, fontSize: 22, color: COLORS.text, marginBottom: 14 },
  menuCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  menuIcon: { width: 44, height: 44, backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  menuLabel: { fontFamily: FONTS.sans, fontSize: 14, color: COLORS.text },
  menuRowRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuValue: { fontFamily: FONTS.mono, fontSize: 9, color: `${COLORS.muted}99`, textTransform: 'uppercase', letterSpacing: 2, backgroundColor: `${COLORS.bg}88`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  securityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  lockBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${COLORS.primary}0d`, borderRadius: RADIUS.lg, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: `${COLORS.primary}22` },
  lockBtnText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  securityCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', gap: 0 },
  securityField: { gap: 14 },
  securityFieldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  securityFieldLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 3, fontWeight: '700' },
  recalibrateBtn: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 2 },
  securityBtnRow: { flexDirection: 'row', gap: 20 },
  revokeBtn: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  commitBtn: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.secondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  securityInput: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: `${COLORS.secondary}33`, borderRadius: RADIUS.xl, paddingHorizontal: 24, paddingVertical: 18, fontFamily: FONTS.mono, fontSize: 12, color: COLORS.text },
  maskedField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: `${COLORS.bg}55`, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.xl, paddingHorizontal: 24, paddingVertical: 18 },
  maskedText: { fontFamily: FONTS.mono, fontSize: 12, color: `${COLORS.text}33`, letterSpacing: 10 },
  securityNote: { fontFamily: FONTS.mono, fontSize: 9, color: `${COLORS.muted}55`, textAlign: 'center', fontStyle: 'italic', lineHeight: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: `${COLORS.danger}0d`, borderRadius: RADIUS['3xl'], paddingVertical: 28, borderWidth: 1, borderColor: `${COLORS.danger}18` },
  logoutBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: `${COLORS.danger}cc`, textTransform: 'uppercase', letterSpacing: 3, fontWeight: '700' },
  logoutConfirm: { backgroundColor: `${COLORS.danger}12`, borderWidth: 1, borderColor: `${COLORS.danger}22`, padding: 28, borderRadius: RADIUS['2xl'], gap: 20 },
  logoutConfirmText: { fontFamily: FONTS.mono, fontSize: 10, color: `${COLORS.danger}cc`, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  logoutConfirmBtns: { flexDirection: 'row', gap: 12 },
  stayBtn: { flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.xl, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  stayBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 2 },
  exitBtn: { flex: 1, backgroundColor: COLORS.danger, borderRadius: RADIUS.xl, paddingVertical: 18, alignItems: 'center', shadowColor: COLORS.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  exitBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: '#fff', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  footer: { alignItems: 'center', paddingVertical: 40, gap: 10, paddingHorizontal: 24 },
  footerDivider: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 16 },
  footerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  footerBrand: { fontFamily: FONTS.serifItalic, fontSize: 44, color: `${COLORS.text}66` },
  footerTagline: { fontFamily: FONTS.mono, fontSize: 9, color: `${COLORS.muted}55`, textTransform: 'uppercase', letterSpacing: 8 },
  footerVersion: { fontFamily: FONTS.mono, fontSize: 7, color: `${COLORS.muted}33`, textTransform: 'uppercase', letterSpacing: 2 },
});
