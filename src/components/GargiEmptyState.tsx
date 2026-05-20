import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BrainCircuit, Sparkles } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS } from '../theme';

interface GargiEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function GargiEmptyState({ title, description, actionLabel, onAction }: GargiEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <BrainCircuit size={80} color={`${COLORS.primary}66`} />
        <View style={styles.sparkleWrap}>
          <Sparkles size={24} color={`${COLORS.secondary}99`} />
        </View>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {actionLabel && (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48, gap: 32, minHeight: 400 },
  iconWrap: { width: 160, height: 160, backgroundColor: `${COLORS.primary}0d`, borderRadius: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${COLORS.primary}22`, position: 'relative' },
  sparkleWrap: { position: 'absolute', top: 24, right: 24 },
  textWrap: { gap: 10, alignItems: 'center' },
  title: { fontFamily: FONTS.serifItalic, fontSize: 22, color: COLORS.text, textAlign: 'center', lineHeight: 30 },
  description: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', lineHeight: 18, maxWidth: 280 },
  actionBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 18, borderRadius: RADIUS.xl, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  actionBtnText: { fontFamily: FONTS.mono, fontSize: 10, color: '#000', textTransform: 'uppercase', letterSpacing: 3, fontWeight: '700' },
});
