/**
 * konnectEV brand identity constants.
 *
 * Coral and Lime belong to the logo / loader / splash identity ONLY.
 * They must never be used for product UI (buttons, navigation, title bands, badges, status).
 * The product interface follows the Emerald theme defined in `colors.ts`.
 */
export const BRAND = {
  /** Electric Coral – upper route of the Mobility Weave and the "EV" signature. */
  coral: '#FF3E1D',
  /** Electric Lime – lower route of the Mobility Weave and splash tagline. */
  lime: '#D4FF00',
  /** Deep Obsidian – app icon / splash ground. */
  obsidian: '#0D1117',
  /** Warm Ceramic – light brand ground. */
  ceramic: '#F3F0E8',
  white: '#FFFFFF',
} as const;

export const BRAND_NAME = 'konnectEV';
export const BRAND_TAGLINE = 'EVERY SIDE MOVING AS ONE';
export const DRIVER_SPLASH_TAGLINE = `DRIVER · ${BRAND_TAGLINE}`;

/** Mobility Weave geometry (96×96 box) shared by the loader, symbol and splash. */
export const WEAVE_PATHS = {
  lime: 'M8 76h20c28 0 18-56 46-56h14',
  coral: 'M8 20h14c28 0 18 56 46 56h20',
  viewBox: 96,
  strokeWidth: 10,
  cutStrokeWidth: 20,
} as const;

/**
 * Native splash composition (1152px canvas) – the React Native splash positions the
 * loader + wordmark with exactly the same proportions so the native → JS handoff is seamless.
 * Values generated together with `assets/splash/konnectev-splash-native.png`.
 */
export const SPLASH_LAYOUT = {
  canvas: 1152,
  /** Rendered width (dp) of the native splash image (must match `imageWidth` in app.json). */
  imageWidth: 288,
  symbolSize: 290,
  symbolX: 431,
  symbolY: 344.5589,
  wordmarkWidth: 580,
  wordmarkHeight: 116.8821,
  wordmarkX: 286,
  wordmarkY: 690.5589,
} as const;
