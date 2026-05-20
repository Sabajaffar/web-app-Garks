import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS } from '../theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  onBack?: () => void;
  onBellPress?: () => void;
}

export default function PageHeader({ title, subtitle, showBack, rightElement, onBack, onBellPress }: PageHeaderProps) {
  const { notifications, mode } = useStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ChevronLeft size={20} color={COLORS.muted} />
          </TouchableOpacity>
        )}
        <View>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      {rightElement ? rightElement : (
        mode !== 'admin' && (
          <TouchableOpacity style={styles.bellBtn} onPress={onBellPress} activeOpacity={0.7}>
            {unreadCount > 0 && <View style={styles.bellDot} />}
            <Bell size={20} color={COLORS.muted} />
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 42, height: 42, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 },
  title: { fontFamily: FONTS.serif, fontSize: 20, color: COLORS.text },
  bellBtn: { width: 38, height: 38, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, backgroundColor: COLORS.primary, borderRadius: 4, zIndex: 1 },
});
