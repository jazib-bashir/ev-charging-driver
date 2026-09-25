/**
 * Color tokens for the GridFlow driver app.
 * Update this file (or swap the active palette in theme/index.ts) to retheme the app.
 */

/** Shared brand accent used in both themes (logo, CTAs, chips). */
export const ACCENT = '#00D9A0';

/** Semantic status green for “Available” labels (not used for primary CTAs). */
export const STATUS_AVAILABLE = '#00A67A';

/** Amber accent for Fast / power callouts — breaks up mint monotone. */
export const STATUS_FAST = '#F59E0B';

export const lightColors = {
  background: '#F8FAFC',
  backgroundCenter: '#F8FAFC',
  surface: '#FFFFFF',
  iconBackground: '#F1F5F9',

  // FIX: Swapped legacy teal values to clean mint infrastructure tokens
  brand: ACCENT,
  brandDark: '#00B383',
  brandLight: '#5EEFC4',
  brandMuted: 'rgba(0, 217, 160, 0.12)',
  accent: ACCENT,

  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#64748B',
  textVersion: '#94A3B8',
  textInverse: '#FFFFFF',
  /** Idle filter-chip label (Slate 600) */
  textChip: '#475569',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  shadow: 'rgba(15, 23, 42, 0.04)',

  selectionBackground: 'rgba(0, 217, 160, 0.12)',
  selectionForeground: ACCENT,
  selectionBorder: '#99f6e4',

  tabActive: 'rgba(0, 217, 160, 0.12)',
  tabActiveIcon: ACCENT,
  tabInactive: '#64748B',
  tabBarBorder: '#F1F5F9',

  notification: '#ef4444',

  statusAvailable: STATUS_AVAILABLE,
  statusAvailableBg: 'rgba(0, 217, 160, 0.15)', // Bumped opacity to 15% for clear daytime rendering
  statusUnavailable: '#6b7280',
  statusUnavailableBg: '#9ca3af',
  statusDot: STATUS_AVAILABLE,
  statusFast: STATUS_FAST,

  distanceBadgeBg: 'rgba(255, 255, 255, 0.94)',
  distanceBadgeText: '#0F172A',

  connectorBg: 'rgba(0, 217, 160, 0.08)',
  connectorText: STATUS_AVAILABLE,
  connectorBorder: '#E2E8F0',

  placeholder: '#E2E8F0',
  placeholderIcon: '#94A3B8',

  overlay: 'rgba(15, 23, 42, 0.4)',
} as const;

export const darkColors: { [K in keyof typeof lightColors]: string } = {
  background: '#060C18',
  backgroundCenter: '#0A1220',
  surface: '#0F1B2D',
  iconBackground: '#1A2738',

  brand: ACCENT,
  brandDark: '#00B886',
  brandLight: '#5EEFC4',
  brandMuted: 'rgba(0, 217, 160, 0.12)',
  accent: ACCENT,

  textPrimary: '#EEF4FF',
  textSecondary: '#B8C5D6',
  textMuted: '#7A90A8',
  textVersion: '#4A5A6E',
  textInverse: '#060C18',
  textChip: '#B8C5D6',

  border: 'rgba(238, 244, 255, 0.1)',
  borderLight: 'rgba(238, 244, 255, 0.06)',

  shadow: 'rgba(0, 0, 0, 0.45)',

  selectionBackground: 'rgba(0, 217, 160, 0.12)',
  selectionForeground: ACCENT,
  selectionBorder: 'rgba(0, 217, 160, 0.35)',

  tabActive: 'rgba(0, 217, 160, 0.12)',
  tabActiveIcon: ACCENT,
  tabInactive: '#64748B',
  tabBarBorder: 'rgba(238, 244, 255, 0.06)',

  notification: '#ef4444',

  statusAvailable: ACCENT,
  statusAvailableBg: 'rgba(0, 217, 160, 0.12)',
  statusUnavailable: '#6b7280',
  statusUnavailableBg: '#4b5563',
  statusDot: ACCENT,
  statusFast: STATUS_FAST,

  distanceBadgeBg: 'rgba(15, 27, 45, 0.92)',
  distanceBadgeText: '#EEF4FF',

  connectorBg: 'rgba(0, 217, 160, 0.1)',
  connectorText: ACCENT,
  connectorBorder: 'rgba(0, 217, 160, 0.25)',

  placeholder: '#1A2738',
  placeholderIcon: '#4A5A6E',

  overlay: 'rgba(0, 0, 0, 0.6)',
};

export type ThemeColors = typeof lightColors;
export type ThemeMode = 'light' | 'dark';
