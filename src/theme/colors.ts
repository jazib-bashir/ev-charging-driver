/**
 * konnectEV product color tokens (Driver App).
 *
 * Source of truth: the konnectEV Dashboard product theme (`#08785E` primary, warm ceramic canvas,
 * obsidian ink) plus the Updated Design secondary emerald (`#10B981`).
 *
 * Coral / Lime are logo-only brand colors and live in `brand.ts` – never use them for UI.
 * The title band under the top nav uses product Emerald (`PRIMARY` / `titleBandBackground`).
 *
 * Legacy token names (`brand`, `accent`, `statusAvailable`, …) are kept so existing screens keep
 * compiling, but they now resolve to the konnectEV Emerald palette.
 */

/** Primary product emerald (Dashboard). Used for fills: primary buttons, selected states, active nav. */
export const PRIMARY = '#08785E';
/** Secondary emerald (Updated Design). Live/available status, gradients, success accents. */
export const SECONDARY = '#10B981';

/** @deprecated Use `PRIMARY`. Kept for modules that still import the legacy constant. */
export const ACCENT = PRIMARY;
/** Semantic status green for “Available” labels. */
export const STATUS_AVAILABLE = PRIMARY;
/** Amber accent for Fast / power callouts. */
export const STATUS_FAST = '#D97706';

export const lightColors = {
  // Surface tiers: canvas → card → raised → sunken
  background: '#FAF9F6',
  backgroundCenter: '#FAF9F6',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#F3F0E8',
  iconBackground: '#F3F0E8',

  // Emerald product palette
  primary: PRIMARY,
  primaryPressed: '#06604B',
  primaryMuted: 'rgba(8, 120, 94, 0.09)',
  primarySoft: 'rgba(8, 120, 94, 0.16)',
  onPrimary: '#FFFFFF',
  secondary: SECONDARY,
  secondaryMuted: 'rgba(16, 185, 129, 0.14)',

  // Legacy aliases (resolve to emerald)
  brand: PRIMARY,
  brandDark: '#06604B',
  brandLight: SECONDARY,
  brandMuted: 'rgba(8, 120, 94, 0.09)',
  accent: PRIMARY,

  // Dark hero panels (ScreenHero, active session, queue, journey)
  heroBackground: '#0D1117',
  heroBackgroundEnd: '#101A1F',
  heroSurface: 'rgba(255, 255, 255, 0.06)',
  heroBorder: 'rgba(255, 255, 255, 0.10)',
  heroText: '#FFFFFF',
  heroTextMuted: 'rgba(255, 255, 255, 0.62)',
  heroAccent: SECONDARY,

  // Text
  textPrimary: '#0B0F14',
  textSecondary: '#4B5563',
  textMuted: '#6B7480',
  textVersion: '#9AA3AE',
  textInverse: '#FFFFFF',
  textChip: '#4B5563',
  textLink: PRIMARY,

  // Borders
  border: '#EAE7E0',
  borderLight: '#F1EEE7',
  borderStrong: '#D9D5CA',

  // Inputs
  inputBackground: '#F3F0E8',
  inputBorder: 'transparent',
  inputBorderFocus: PRIMARY,
  inputPlaceholder: '#8A929C',

  shadow: 'rgba(11, 15, 20, 0.08)',

  selectionBackground: 'rgba(8, 120, 94, 0.09)',
  selectionForeground: PRIMARY,
  selectionBorder: 'rgba(8, 120, 94, 0.38)',

  // Navigation
  /** Legacy light top chrome token (ScreenHero uses heroBackground). */
  navBarBackground: '#FFFFFF',
  /** Legacy emerald title-band token (ScreenHero uses heroBackground). */
  titleBandBackground: PRIMARY,
  titleBandText: '#FFFFFF',
  titleBandTextMuted: 'rgba(255, 255, 255, 0.85)',
  titleBandBorder: 'rgba(255, 255, 255, 0.22)',
  /** Warm ceramic floating tab dock. */
  tabBarBackground: '#FAF9F6',
  tabBarBorder: '#E3EDE8',
  tabActive: PRIMARY,
  /** Soft Emerald tint (unused by expanding pill; kept for theme completeness). */
  tabActiveTint: '#DDF1E9',
  tabActiveIcon: '#FFFFFF',
  tabActiveLabel: '#FFFFFF',
  /** Muted Slate for idle tab icons and labels. */
  tabInactive: '#52616B',

  notification: '#EF4444',

  // Semantic states
  success: SECONDARY,
  successText: PRIMARY,
  successBg: 'rgba(16, 185, 129, 0.14)',
  warning: '#D97706',
  warningText: '#B45309',
  warningBg: 'rgba(245, 158, 11, 0.14)',
  error: '#DC2626',
  errorText: '#B91C1C',
  errorBg: 'rgba(220, 38, 38, 0.09)',
  errorBorder: 'rgba(220, 38, 38, 0.30)',
  info: '#2563EB',
  infoText: '#1D4ED8',
  infoBg: 'rgba(37, 99, 235, 0.09)',

  // Station / charger status
  statusAvailable: PRIMARY,
  statusAvailableBg: 'rgba(16, 185, 129, 0.16)',
  statusUnavailable: '#6B7480',
  statusUnavailableBg: '#E7E4DC',
  statusDot: SECONDARY,
  statusFast: STATUS_FAST,

  // Disabled / loading
  disabledBackground: '#E7E4DC',
  disabledText: '#A3AAB3',
  skeletonBase: '#EDEAE2',
  skeletonHighlight: '#F8F6F1',

  distanceBadgeBg: 'rgba(255, 255, 255, 0.94)',
  distanceBadgeText: '#0B0F14',

  connectorBg: 'rgba(8, 120, 94, 0.08)',
  connectorText: PRIMARY,
  connectorBorder: '#EAE7E0',

  placeholder: '#EDEAE2',
  placeholderIcon: '#9AA3AE',

  overlay: 'rgba(11, 15, 20, 0.45)',
} as const;

export const darkColors: { [K in keyof typeof lightColors]: string } = {
  background: '#0D1117',
  backgroundCenter: '#0D1117',
  surface: '#151D22',
  surfaceRaised: '#1B252B',
  surfaceSunken: '#0A0E13',
  iconBackground: '#1B252B',

  primary: PRIMARY,
  primaryPressed: '#0A8F70',
  primaryMuted: 'rgba(16, 185, 129, 0.12)',
  primarySoft: 'rgba(16, 185, 129, 0.20)',
  onPrimary: '#FFFFFF',
  secondary: SECONDARY,
  secondaryMuted: 'rgba(16, 185, 129, 0.18)',

  brand: PRIMARY,
  brandDark: '#06604B',
  brandLight: SECONDARY,
  brandMuted: 'rgba(16, 185, 129, 0.12)',
  accent: SECONDARY,

  heroBackground: '#101A1F',
  heroBackgroundEnd: '#101A1F',
  heroSurface: 'rgba(255, 255, 255, 0.06)',
  heroBorder: 'rgba(255, 255, 255, 0.10)',
  heroText: '#FFFFFF',
  heroTextMuted: 'rgba(255, 255, 255, 0.62)',
  heroAccent: SECONDARY,

  textPrimary: '#F3F0E8',
  textSecondary: '#B4BCC6',
  textMuted: '#8A949F',
  textVersion: '#5C6570',
  textInverse: '#0D1117',
  textChip: '#B4BCC6',
  textLink: SECONDARY,

  border: 'rgba(243, 240, 232, 0.10)',
  borderLight: 'rgba(243, 240, 232, 0.06)',
  borderStrong: 'rgba(243, 240, 232, 0.20)',

  inputBackground: '#0F151B',
  inputBorder: 'rgba(243, 240, 232, 0.08)',
  inputBorderFocus: SECONDARY,
  inputPlaceholder: '#6B7480',

  shadow: 'rgba(0, 0, 0, 0.5)',

  selectionBackground: 'rgba(16, 185, 129, 0.12)',
  selectionForeground: SECONDARY,
  selectionBorder: 'rgba(16, 185, 129, 0.45)',

  navBarBackground: '#151D22',
  titleBandBackground: PRIMARY,
  titleBandText: '#FFFFFF',
  titleBandTextMuted: 'rgba(255, 255, 255, 0.85)',
  titleBandBorder: 'rgba(255, 255, 255, 0.22)',
  tabBarBackground: '#151D22',
  tabBarBorder: 'rgba(243, 240, 232, 0.10)',
  tabActive: PRIMARY,
  tabActiveTint: 'rgba(16, 185, 129, 0.16)',
  tabActiveIcon: '#FFFFFF',
  tabActiveLabel: '#FFFFFF',
  tabInactive: '#52616B',

  notification: '#F87171',

  success: SECONDARY,
  successText: '#34D399',
  successBg: 'rgba(16, 185, 129, 0.18)',
  warning: '#F59E0B',
  warningText: '#FBBF24',
  warningBg: 'rgba(245, 158, 11, 0.16)',
  error: '#F87171',
  errorText: '#FCA5A5',
  errorBg: 'rgba(248, 113, 113, 0.14)',
  errorBorder: 'rgba(248, 113, 113, 0.38)',
  info: '#60A5FA',
  infoText: '#93C5FD',
  infoBg: 'rgba(96, 165, 250, 0.14)',

  statusAvailable: '#34D399',
  statusAvailableBg: 'rgba(16, 185, 129, 0.18)',
  statusUnavailable: '#8A949F',
  statusUnavailableBg: 'rgba(243, 240, 232, 0.10)',
  statusDot: SECONDARY,
  statusFast: '#FBBF24',

  disabledBackground: 'rgba(243, 240, 232, 0.08)',
  disabledText: '#5C6570',
  skeletonBase: '#1B252B',
  skeletonHighlight: '#26333B',

  distanceBadgeBg: 'rgba(21, 29, 34, 0.92)',
  distanceBadgeText: '#F3F0E8',

  connectorBg: 'rgba(16, 185, 129, 0.10)',
  connectorText: '#34D399',
  connectorBorder: 'rgba(16, 185, 129, 0.28)',

  placeholder: '#1B252B',
  placeholderIcon: '#5C6570',

  overlay: 'rgba(0, 0, 0, 0.62)',
};

export type ThemeColors = typeof lightColors;
export type ThemeMode = 'light' | 'dark';
