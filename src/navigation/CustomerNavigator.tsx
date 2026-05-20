import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, ShoppingBag, Grid, Heart, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../theme';
import { useStore } from '../store/useStore';

import CustomerHome from '../pages/customer/Home';
import Shop from '../pages/customer/Shop';
import Categories from '../pages/customer/Categories';
import Wishlist from '../pages/customer/Wishlist';
import Profile from '../pages/Profile';
import ProductDetail from '../pages/customer/ProductDetail';
import Cart from '../pages/customer/Cart';
import Notifications from '../pages/customer/Notifications';
import OrderTracking from '../pages/customer/OrderTracking';
import GargiAssistant from '../components/GargiAssistant';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const NAV_ITEMS = [
  { name: 'Home', label: 'Home', Icon: Home },
  { name: 'Shop', label: 'Shop', Icon: ShoppingBag },
  { name: 'Explore', label: 'Explore', Icon: Grid },
  { name: 'Cabinet', label: 'Cabinet', Icon: Heart },
  { name: 'Profile', label: 'Profile', Icon: User },
];

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4 }]}>
      {state.routes.map((route: any, index: number) => {
        const isActive = state.index === index;
        const item = NAV_ITEMS[index];
        if (!item) return null;
        const { Icon } = item;
        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconWrap, isActive && styles.tabIconActive]}>
              <Icon size={20} color={isActive ? COLORS.primary : COLORS.muted} strokeWidth={isActive ? 2.5 : 2} />
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{item.label}</Text>
            {isActive && <View style={styles.tabDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerHome" component={CustomerHome} />
      <Stack.Screen name="ProductDetail" component={ProductDetail} />
      <Stack.Screen name="Cart" component={Cart} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="OrderTracking" component={OrderTracking} />
    </Stack.Navigator>
  );
}

export default function CustomerNavigator() {
  const { cart } = useStore();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Shop" component={Shop} />
        <Tab.Screen name="Explore" component={Categories} />
        <Tab.Screen name="Cabinet" component={Wishlist} />
        <Tab.Screen name="Profile" component={Profile} />
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
    borderTopColor: 'rgba(148,163,184,0.08)',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tabIconWrap: {
    padding: 8,
    borderRadius: 12,
  },
  tabIconActive: {
    backgroundColor: `${COLORS.primary}18`,
  },
  tabLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'transparent',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontFamily: FONTS.mono,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
