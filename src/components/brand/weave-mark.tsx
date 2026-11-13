import Svg, { Defs, G, Mask, Path, Rect } from 'react-native-svg';

import { BRAND, WEAVE_PATHS } from '@/theme/brand';

type WeaveMarkProps = {
  size?: number;
  /** Overall opacity of the symbol (feedback illustrations use a faint mark). */
  opacity?: number;
  /** Accessible label. */
  label?: string;
  /**
   * Monochrome treatment (approved single-color symbol with the underpass gap).
   * Default is the full-color Coral + Lime Mobility Weave.
   */
  monochrome?: string;
};

/**
 * Approved konnectEV Mobility Weave symbol (96×96 geometry from `konnectev-symbol-coral.svg`).
 * Geometry, stroke widths and colors are never altered.
 */
export function WeaveMark({ size = 48, opacity = 1, label = 'konnectEVS', monochrome }: WeaveMarkProps) {
  const lime = monochrome ?? BRAND.lime;
  const coral = monochrome ?? BRAND.coral;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <Defs>
        <Mask id="weave-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="96" height="96">
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
      <G opacity={opacity}>
        <Path
          d={WEAVE_PATHS.lime}
          fill="none"
          stroke={lime}
          strokeWidth={WEAVE_PATHS.strokeWidth}
          strokeLinecap="round"
          mask="url(#weave-cut)"
        />
        <Path
          d={WEAVE_PATHS.coral}
          fill="none"
          stroke={coral}
          strokeWidth={WEAVE_PATHS.strokeWidth}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
