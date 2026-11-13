import Svg, { Circle, Defs, G, Mask, Path, Rect, Text as SvgText } from 'react-native-svg';

import { BRAND, WEAVE_PATHS } from '@/theme/brand';
import { useTheme } from '@/theme';

/* -------------------------------------------------------------------------------------------------
 * Feedback glyphs – `konnectev-feedback-symbols.svg` (empty / offline / success / error).
 * A faint Mobility Weave sits behind a single semantic glyph, exactly as in the approved artwork.
 * Glyph colors follow the active theme (obsidian glyphs would vanish on dark surfaces).
 * ----------------------------------------------------------------------------------------------- */

export type FeedbackKind = 'empty' | 'offline' | 'success' | 'error';

type FeedbackIllustrationProps = {
  kind: FeedbackKind;
  size?: number;
};

export function FeedbackIllustration({ kind, size = 120 }: FeedbackIllustrationProps) {
  const { theme } = useTheme();
  const glyph = {
    empty: { d: 'M28 58h40M35 41h26M42 25h12', color: theme.colors.textPrimary },
    offline: { d: 'M27 63c12-13 30-13 42 0M38 50c6-6 14-6 20 0M48 70h.1', color: theme.colors.textMuted },
    success: { d: 'M25 48l14 14 32-35', color: theme.colors.successText },
    error: { d: 'M31 31l34 34M65 31 31 65', color: BRAND.coral },
  }[kind];

  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" accessibilityRole="image" accessibilityLabel={`${kind} state`}>
      <Defs>
        <Mask id={`fb-cut-${kind}`} maskUnits="userSpaceOnUse" x="0" y="0" width="96" height="96">
          <Rect width="96" height="96" fill="#fff" />
          <Path d={WEAVE_PATHS.coral} stroke="#000" strokeWidth={20} strokeLinecap="round" fill="none" />
        </Mask>
      </Defs>
      <G opacity={0.14}>
        <Path
          d={WEAVE_PATHS.lime}
          fill="none"
          stroke={BRAND.lime}
          strokeWidth={10}
          strokeLinecap="round"
          mask={`url(#fb-cut-${kind})`}
        />
        <Path d={WEAVE_PATHS.coral} fill="none" stroke={BRAND.coral} strokeWidth={10} strokeLinecap="round" />
      </G>
      <Path
        d={glyph.d}
        fill="none"
        stroke={glyph.color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Authentication illustrations – `public/auth-assets/*.svg` from Updated Design.
 * ----------------------------------------------------------------------------------------------- */

const CORAL = BRAND.coral;
const LIME = BRAND.lime;
const OBSIDIAN = BRAND.obsidian;
const WARM = BRAND.ceramic;

type AuthTileProps = { size?: number };

/** `konnectev-auth-success.svg` */
export function AuthSuccessIllustration({ size = 160 }: AuthTileProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" accessibilityRole="image" accessibilityLabel="Success">
      <Rect width="512" height="512" rx="120" fill={OBSIDIAN} />
      <Circle cx="256" cy="256" r="150" fill="none" stroke={LIME} strokeWidth="18" opacity={0.18} />
      <Circle cx="256" cy="256" r="112" fill={LIME} />
      <Path
        d="m184 258 46 46 102-112"
        fill="none"
        stroke={OBSIDIAN}
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M74 104h92M346 408h92" stroke={CORAL} strokeWidth="18" strokeLinecap="round" />
    </Svg>
  );
}

/** `konnectev-auth-offline.svg` */
export function AuthOfflineIllustration({ size = 160 }: AuthTileProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" accessibilityRole="image" accessibilityLabel="Offline">
      <Rect width="512" height="512" rx="120" fill={WARM} />
      <Path
        d="M90 226c91-94 241-94 332 0M148 286c59-57 157-57 216 0M217 347c22-20 56-20 78 0"
        fill="none"
        stroke={OBSIDIAN}
        strokeWidth="24"
        strokeLinecap="round"
      />
      <Path d="M98 94 414 418" stroke={CORAL} strokeWidth="30" strokeLinecap="round" />
      <Circle cx="256" cy="405" r="18" fill={LIME} />
    </Svg>
  );
}

/** `konnectev-auth-network-signal.svg` – route lines + live nodes (without the text caption). */
export function AuthNetworkIllustration({ width = 360 }: { width?: number }) {
  const height = (width * 760) / 1200;
  return (
    <Svg width={width} height={height} viewBox="0 0 1200 760" accessibilityRole="image" accessibilityLabel="Live network">
      <Rect width="1200" height="760" fill={WARM} />
      <Path
        d="M-40 570C170 140 360 690 590 285S970 530 1250 90"
        fill="none"
        stroke={CORAL}
        strokeWidth="20"
        strokeLinecap="round"
      />
      <Path
        d="M-20 200C250 620 390 30 655 440s380-190 600 115"
        fill="none"
        stroke={LIME}
        strokeWidth="20"
        strokeLinecap="round"
      />
      <G fill={OBSIDIAN}>
        <Circle cx="205" cy="370" r="20" />
        <Circle cx="586" cy="292" r="20" />
        <Circle cx="955" cy="342" r="20" />
      </G>
      <G fill="none" stroke={OBSIDIAN} opacity={0.15}>
        <Circle cx="205" cy="370" r="70" />
        <Circle cx="205" cy="370" r="120" />
        <Circle cx="586" cy="292" r="70" />
        <Circle cx="586" cy="292" r="120" />
        <Circle cx="955" cy="342" r="70" />
        <Circle cx="955" cy="342" r="120" />
      </G>
      <G transform="translate(496 246)">
        <Rect width="180" height="92" rx="46" fill={OBSIDIAN} />
        <SvgText x="90" y="58" textAnchor="middle" fill={WARM} fontWeight="700" fontSize="25">
          LIVE · 99.9%
        </SvgText>
      </G>
    </Svg>
  );
}

/** `konnectev-auth-infrastructure.svg` – architectural charging arrival. */
export function AuthInfrastructureIllustration({ width = 360 }: { width?: number }) {
  const height = (width * 760) / 1200;
  return (
    <Svg width={width} height={height} viewBox="0 0 1200 760" accessibilityRole="image" accessibilityLabel="Charging infrastructure">
      <Rect width="1200" height="760" fill={OBSIDIAN} />
      <Path d="M0 600 385 310h815v450H0Z" fill="#171D23" />
      <Path d="M385 310h815M252 410h948M120 510h1080" stroke="#fff" opacity={0.08} />
      <Path d="M144 600h860" stroke={WARM} opacity={0.25} strokeWidth="2" />
      <G transform="translate(760 220)">
        <Rect width="132" height="296" rx="18" fill={WARM} />
        <Rect x="25" y="35" width="82" height="105" rx="8" fill={OBSIDIAN} />
        <Path d="m72 52-29 48h26l-9 28 38-58H70Z" fill={LIME} />
        <Path d="M130 80c120 0 24 190 141 190" fill="none" stroke={CORAL} strokeWidth="14" strokeLinecap="round" />
        <Circle cx="271" cy="270" r="16" fill={CORAL} />
      </G>
      <G transform="translate(260 420)">
        <Path d="M30 105h390l-40-87H145L74 65Z" fill={CORAL} />
        <Path d="m145 18 46-75h127l62 75" fill="none" stroke={WARM} strokeWidth="24" strokeLinejoin="round" />
        <Circle cx="125" cy="110" r="39" fill={OBSIDIAN} stroke={WARM} strokeWidth="14" />
        <Circle cx="335" cy="110" r="39" fill={OBSIDIAN} stroke={WARM} strokeWidth="14" />
      </G>
      <Path d="M74 680h420" stroke={LIME} strokeWidth="6" />
    </Svg>
  );
}
