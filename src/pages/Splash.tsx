import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag, Sparkles, BrainCircuit, ArrowRight } from 'lucide-react-native';
import { COLORS, FONTS } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Welcome to GarKS',
    subtitle: 'Premium Fashion',
    description: 'Discover a curated collection of high-end garments designed for the modern individual.',
    Icon: ShoppingBag,
    color: '#4ade80',
  },
  {
    title: 'Define Your Style',
    subtitle: 'Smart. Simple.',
    description: 'Experience effortless shopping with styles that define you. Quality meets elegance.',
    Icon: Sparkles,
    color: '#e0c9a8',
  },
  {
    title: 'Powered by Gargi',
    subtitle: 'Intelligent AI',
    description: 'The fashion assistant that understands your taste and keeps the store running smoothly.',
    Icon: BrainCircuit,
    color: '#f1f5f9',
  },
];

export default function Splash({ navigation }: any) {
  const [current, setCurrent] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const animateTo = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(nextIndex);
      translateX.setValue(40);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      animateTo(current + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const slide = SLIDES[current];
  const { Icon } = slide;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {current < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <Animated.View style={[styles.content, { opacity, transform: [{ translateX }] }]}>
        <View style={[styles.iconCircle, { backgroundColor: `${slide.color}1a`, borderColor: `${slide.color}40` }]}>
          <Icon size={52} color={slide.color} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === current ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.btnText}>
            {current === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <ArrowRight size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 28,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
  },
  skipText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 36,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 5,
    textAlign: 'center',
  },
  description: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
    maxWidth: 280,
  },
  footer: {
    paddingHorizontal: 32,
    gap: 28,
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { height: 4, borderRadius: 2 },
  dotActive: { width: 28, backgroundColor: COLORS.primary },
  dotInactive: { width: 8, backgroundColor: COLORS.card },
  btn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  btnText: {
    fontFamily: FONTS.sansBold,
    fontSize: 15,
    color: '#000',
    letterSpacing: 0.5,
  },
});
