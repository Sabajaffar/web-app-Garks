import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { useEffect, useRef } from 'react';
import { Bell, X, Check, Zap, Info, BellOff } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS } from '../theme';

export default function NotificationCenter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { notifications, markNotificationsRead, notificationsMuted, toggleMuteNotifications } = useStore();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  const handleClose = () => {
    markNotificationsRead();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Updates for You</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={toggleMuteNotifications}
              style={[styles.muteBtn, notificationsMuted && styles.muteBtnActive]}
              activeOpacity={0.7}
            >
              {notificationsMuted ? <BellOff size={20} color={COLORS.danger} /> : <Bell size={20} color={COLORS.muted} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Bell size={60} color={`${COLORS.muted}33`} strokeWidth={1} />
              <Text style={styles.emptyText}>No recent activity. Check back soon for exclusive drops!</Text>
            </View>
          ) : (
            notifications.map(notif => {
              const isOrder = notif.type === 'order';
              const isSale = notif.type === 'sale';
              const iconColor = isSale ? COLORS.secondary : isOrder ? COLORS.primary : COLORS.muted;
              const iconBg = isSale ? `${COLORS.secondary}22` : isOrder ? `${COLORS.primary}22` : COLORS.bg;
              const Icon = isSale ? Zap : isOrder ? Check : Info;
              return (
                <View
                  key={notif.id}
                  style={[
                    styles.notifCard,
                    notif.read ? styles.notifCardRead : styles.notifCardUnread,
                  ]}
                >
                  {!notif.read && (
                    <View style={styles.newBadge}>
                      <Zap size={12} color="#000" fill="#000" />
                    </View>
                  )}
                  <View style={[styles.notifIcon, { backgroundColor: iconBg }]}>
                    <Icon size={18} color={iconColor} />
                  </View>
                  <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.markAllBtn} onPress={handleClose} activeOpacity={0.85}>
            <Text style={styles.markAllBtnText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 200 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  panel: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: 360, backgroundColor: COLORS.bg, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.06)', flexDirection: 'column' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 28, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  title: { fontFamily: FONTS.serif, fontSize: 24, color: COLORS.text },
  subtitle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 8 },
  muteBtn: { width: 44, height: 44, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  muteBtnActive: { backgroundColor: `${COLORS.danger}22` },
  closeBtn: { width: 44, height: 44, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { fontFamily: FONTS.serifItalic, fontSize: 16, color: COLORS.muted, textAlign: 'center', paddingHorizontal: 20, lineHeight: 24 },
  notifCard: { flexDirection: 'row', gap: 14, padding: 18, borderRadius: RADIUS['2xl'], borderWidth: 1, position: 'relative', overflow: 'hidden' },
  notifCardRead: { backgroundColor: `${COLORS.card}66`, borderColor: 'rgba(255,255,255,0.04)' },
  notifCardUnread: { backgroundColor: COLORS.card, borderColor: `${COLORS.primary}22` },
  newBadge: { position: 'absolute', top: 0, right: 0, width: 28, height: 28, backgroundColor: COLORS.primary, borderBottomLeftRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  notifIcon: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifContent: { flex: 1, gap: 4 },
  notifTitle: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.text, lineHeight: 18 },
  notifMessage: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted, lineHeight: 17 },
  notifTime: { fontFamily: FONTS.mono, fontSize: 9, color: `${COLORS.muted}88`, textTransform: 'uppercase', marginTop: 2 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  markAllBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 18, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  markAllBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: '#000', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
});
