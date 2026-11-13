import Svg, { Defs, G, Mask, Path, Rect } from 'react-native-svg';

import { BRAND, WEAVE_PATHS } from '@/theme/brand';

import type { LogoTone } from './wordmark';
import { WORDMARK_EV_PATH, WORDMARK_KONNECT_PATH, WORDMARK_S_PATH } from './wordmark-paths';

type KonnectEvLogoProps = {
  /** Rendered width in dp (aspect ratio 480:108). */
  width?: number;
  /** `onDark` uses the approved white wordmark; `onLight` uses the approved obsidian wordmark. */
  tone?: LogoTone;
};

/**
 * Approved konnectEVS primary horizontal signature (`konnectev-logo-dark/light.svg`):
 * Mobility Weave + wordmark with raised coral "EV" and baseline-aligned coral "S".
 * Minimum recommended width: 100dp.
 */
export function KonnectEvLogo({ width = 160, tone = 'onLight' }: KonnectEvLogoProps) {
  const height = (width * 108) / 480;

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 480 108"
      accessibilityRole="image"
      accessibilityLabel="konnectEVS"
    >
      <Defs>
        <Mask id="logo-weave-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="96" height="96">
          <Rect width="96" height="96" fill="#fff" />
          <Path
            d={WEAVE_PATHS.coral}
            stroke="#000"
            strokeWidth={WEAVE_PATHS.cutStrokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        </Mask>
      </Defs>
      <G transform="translate(8 8) scale(0.92)">
        <Path
          d={WEAVE_PATHS.lime}
          fill="none"
          stroke={BRAND.lime}
          strokeWidth={WEAVE_PATHS.strokeWidth}
          strokeLinecap="round"
          mask="url(#logo-weave-cut)"
        />
        <Path
          d={WEAVE_PATHS.coral}
          fill="none"
          stroke={BRAND.coral}
          strokeWidth={WEAVE_PATHS.strokeWidth}
          strokeLinecap="round"
        />
      </G>
      <Path d={WORDMARK_KONNECT_PATH} fill={tone === 'onDark' ? BRAND.white : BRAND.obsidian} />
      <Path d={WORDMARK_EV_PATH} fill={BRAND.coral} />
      <Path d={WORDMARK_S_PATH} fill={BRAND.coral} />
    </Svg>
  );
}
