import Svg, { Path } from 'react-native-svg';

import { BRAND } from '@/theme/brand';

import {
  WORDMARK_EV_PATH,
  WORDMARK_KONNECT_PATH,
  WORDMARK_VIEWBOX,
} from './wordmark-paths';

export type LogoTone = 'onDark' | 'onLight';

type WordmarkProps = {
  /** Rendered width in dp. Height follows the approved aspect ratio. */
  width?: number;
  /** `onDark` = white "konnect"; `onLight` = obsidian "konnect". "EV" is always Coral and raised. */
  tone?: LogoTone;
};

/**
 * Approved konnectEV wordmark: "konnect" + raised coral "EV", rendered from vector outlines of the
 * official Space Grotesk Bold artwork (not live text).
 */
export function Wordmark({ width = 180, tone = 'onDark' }: WordmarkProps) {
  const { x, y, width: vbW, height: vbH } = WORDMARK_VIEWBOX;
  const height = (width * vbH) / vbW;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`${x} ${y} ${vbW} ${vbH}`}
      accessibilityRole="image"
      accessibilityLabel="konnectEV"
    >
      <Path d={WORDMARK_KONNECT_PATH} fill={tone === 'onDark' ? BRAND.white : BRAND.obsidian} />
      <Path d={WORDMARK_EV_PATH} fill={BRAND.coral} />
    </Svg>
  );
}
