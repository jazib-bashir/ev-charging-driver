import type { ViewStyle } from 'react-native';

/**
 * Soft premium card elevation approximating:
 * 0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 4px 10px -3px rgba(15, 23, 42, 0.02)
 */
export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  } satisfies ViewStyle,
  tabBar: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 8,
  } satisfies ViewStyle,
  badge: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  } satisfies ViewStyle,
} as const;

export type ThemeShadows = typeof shadows;
