export const COLORS = {
  bg: '#1B2B5E',
  card: '#132147',
  cardAlt: '#0D1A3A',
  primary: '#F5E6D3',
  secondary: '#C9A96E',
  text: '#FFFFFF',
  muted: '#8B9CC8',
  border: '#253875',
  danger: '#f87171',
  success: '#4ade80',
  warning: '#C9A96E',
  purple: '#a855f7',
  pink: '#ec4899',
  black: '#000000',
  white: '#ffffff',
  gold: '#C9A96E',
};

export function setThemeColors(theme: 'dark' | 'light' | 'premium-gold'): void {
  if (theme === 'light') {
    Object.assign(COLORS, {
      bg: '#F5E6D3',
      card: '#EAD8C3',
      cardAlt: '#DEC9AD',
      primary: '#1B2B5E',
      secondary: '#C9A96E',
      text: '#1B2B5E',
      muted: '#6B7BA4',
      border: '#D4C4AE',
      danger: '#e53e3e',
      success: '#276749',
      warning: '#B8860B',
      gold: '#C9A96E',
    });
  } else {
    Object.assign(COLORS, {
      bg: '#1B2B5E',
      card: '#132147',
      cardAlt: '#0D1A3A',
      primary: '#F5E6D3',
      secondary: '#C9A96E',
      text: '#FFFFFF',
      muted: '#8B9CC8',
      border: '#253875',
      danger: '#f87171',
      success: '#4ade80',
      warning: '#C9A96E',
      gold: '#C9A96E',
    });
  }
}

export const FONTS = {
  serif: 'Georgia',
  serifItalic: 'Georgia',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansBold: 'DMSans_700Bold',
  mono: 'IBMPlexMono_400Regular',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  primary: {
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};
