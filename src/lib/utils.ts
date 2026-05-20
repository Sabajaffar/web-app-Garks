import * as Haptics from 'expo-haptics';

export const haptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
  try {
    if (type === 'success' || type === 'warning' || type === 'error') {
      const notifMap = {
        success: Haptics.NotificationFeedbackType.Success,
        warning: Haptics.NotificationFeedbackType.Warning,
        error: Haptics.NotificationFeedbackType.Error,
      };
      Haptics.notificationAsync(notifMap[type as keyof typeof notifMap]);
    } else {
      const impactMap = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      Haptics.impactAsync(impactMap[type as keyof typeof impactMap]);
    }
  } catch (_) {}
};

export const cn = (..._args: any[]): string => '';

export const formatCurrency = (amount: number, prefix = 'PKR ') =>
  `${prefix}${amount.toLocaleString()}`;

export const formatNumber = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
