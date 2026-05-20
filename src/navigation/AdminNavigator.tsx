import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Package, Megaphone, BrainCircuit, Bell, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../theme';
import { useStore } from '../store/useStore';

import AdminDashboard from '../pages/admin/Dashboard';
import Inventory from '../pages/admin/Inventory';
import Marketing from '../pages/admin/Marketing';
import AIIntelligence from '../pages/admin/AIIntelligence';
import Profile from '../pages/Profile';
import NotificationCenter from '../components/NotificationCenter';
import GargiAssistant from '../components/GargiAssistant';

const Tab = createBottomTabNavigator();

const NAV_ITEMS = [
  { name: 'Dash', label: 'Dash', Icon: LayoutDashboard },
  { name: 'Stock', label: 'Stock', Icon: Package },
  { name: 'Growth', label: 'Growth', Icon: Megaphone },
  { name: 'Assistant', label: 'AI', Icon: BrainCircuit },
  { name: 'Alerts', label: 'Alerts', Icon: Bell },
  { name: 'AdminProfile', label: 'Profile', Icon: User },
];

function CustomAdminTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { inventory, notifications, livelyUpdateMetrics } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const lowStockCount = inventory.filter(p => p.stock < 5).length;

  useEffect(() => {
    const timer = setInterval(() => { livelyUpdateMetrics(); }, 7000);
    return () => clearInterval(timer);
  }, [livelyUpdateMetrics]);

  return (
    <>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4 }]}>
        {state.routes.map((route: any, index: number) => {
          const isActive = state.index === index;
          const item = NAV_ITEMS[index];
          if (!item) return null;
          const { Icon } = item;
          const isAlerts = item.name === 'Alerts';
          const isAssistant = item.name === 'Assistant';

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => {
                if (isAlerts) { setShowNotifications(true); return; }
                navigation.navigate(route.name);
              }}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconWrap, isActive && styles.tabIconActive]}>
                <Icon size={18} color={isActive ? COLORS.primary : COLORS.muted} strokeWidth={isActive ? 2.5 : 2} />
                {isAssistant && lowStockCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{lowStockCount}</Text>
                  </View>
                )}
                {isAlerts && unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: COLORS.primary }]}>
                    <Text style={[styles.badgeText, { color: '#000' }]}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{item.label}</Text>
              {isActive && !isAlerts && <View style={styles.tabDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
}

export default function AdminNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomAdminTabBar {...props} />}
      >
        <Tab.Screen name="Dash" component={AdminDashboard} />
        <Tab.Screen name="Stock" component={Inventory} />
        <Tab.Screen name="Growth" component={Marketing} />
        <Tab.Screen name="Assistant" component={AIIntelligence} />
        <Tab.Screen name="Alerts" component={AdminDashboard} />
        <Tab.Screen name="AdminProfile" component={Profile} />
      </Tab.Navigator>
      <GargiAssistant />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.bg,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: `${COLORS.primary}22`,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabIconWrap: { padding: 7, borderRadius: 12 },
  tabIconActive: { backgroundColor: `${COLORS.primary}18` },
  tabLabel: { fontFamily: FONTS.mono, fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5, color: 'transparent' },
  tabLabelActive: { color: COLORS.primary },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 4 },
  badge: { position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontSize: 8, fontWeight: '700', color: '#fff' },
});
