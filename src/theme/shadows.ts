import type { ViewStyle } from 'react-native';

/**
 * Elevation tokens: none / card / raised / floating (+ legacy `tabBar`, `badge`).
 * Shadows use the obsidian ink color; dark-mode surfaces rely on borders + tier contrast instead.
 */
export const shadows = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  } satisfies ViewStyle,
  card: {
    shadowColor: '#0B0F14',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  } satisfies ViewStyle,
  raised: {
    shadowColor: '#0B0F14',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  } satisfies ViewStyle,
  floating: {
    shadowColor: '#0B0F14',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 14,
  } satisfies ViewStyle,
  tabBar: {
    shadowColor: '#0B0F14',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  } satisfies ViewStyle,
  badge: {
    shadowColor: '#0B0F14',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  } satisfies ViewStyle,
} as const;

export type ThemeShadows = typeof shadows;
