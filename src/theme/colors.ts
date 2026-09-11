/**
 * Color tokens for the GridFlow driver app.
 * Update this file (or swap the active palette in theme/index.ts) to retheme the app.
 */
export const lightColors = {
  background: '#f5f7f9',
  backgroundCenter: '#fafbfc',
  surface: '#ffffff',
  iconBackground: '#e9eef5',

  brand: '#0d9488',
  brandDark: '#0f766e',
  brandLight: '#5aab9e',
  brandMuted: '#f0fdfa',

  textPrimary: '#1c1c1e',
  textSecondary: '#4b5563',
  textMuted: '#8b95a1',
  textVersion: '#b8c0c8',
  textInverse: '#ffffff',

  border: '#e5e7eb',
  borderLight: '#f0f2f5',

  shadow: 'rgba(15, 23, 42, 0.06)',

  selectionBackground: '#f0fdfa',
  selectionForeground: '#0d9488',
  selectionBorder: '#99f6e4',

  tabActive: '#f0fdfa',
  tabActiveIcon: '#0d9488',
  tabInactive: '#8b95a1',

  notification: '#ef4444',

  statusAvailable: '#0d9488',
  statusAvailableBg: '#0d9488',
  statusUnavailable: '#6b7280',
  statusUnavailableBg: '#9ca3af',
  statusDot: '#22c55e',

  distanceBadgeBg: 'rgba(255, 255, 255, 0.94)',
  distanceBadgeText: '#374151',

  connectorBg: '#f0f4f8',
  connectorText: '#0d9488',
  connectorBorder: '#e2e8f0',

  placeholder: '#e9eef5',
  placeholderIcon: '#b8c5d0',

  overlay: 'rgba(0, 0, 0, 0.45)',
} as const;

export type ThemeColors = typeof lightColors;
