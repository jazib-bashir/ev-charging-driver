import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';

/** Same canvas as the Login `AuthWaveHeader` art (Figma authArt). */
export const EMERALD_HEADER_VIEWBOX = '0 0 500 272';
export const EMERALD_HEADER_WAVE_PATH = 'M 0 0 L 500 0 L 500 190 Q 210 280, 0 214 Z';

type EmeraldHeaderArtProps = {
  /** When true, fills a rectangular band (title strip). When false, uses the login wave silhouette. */
  rectangular?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Decorative emerald ground shared by Login and the app title bands:
 * primary → primaryPressed gradient plus the white concentric circle strokes.
 */
export function EmeraldHeaderArt({ rectangular = false, style }: EmeraldHeaderArtProps) {
  const { theme } = useTheme();
  const stroke = theme.colors.titleBandText;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={EMERALD_HEADER_VIEWBOX}
      preserveAspectRatio={rectangular ? 'xMidYMin slice' : 'none'}
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="emerald-header-gradient" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={theme.colors.primary} />
          <Stop offset="1" stopColor={theme.colors.primaryPressed} />
        </LinearGradient>
      </Defs>
      {rectangular ? (
        <Path d="M 0 0 L 500 0 L 500 272 L 0 272 Z" fill="url(#emerald-header-gradient)" />
      ) : (
        <Path d={EMERALD_HEADER_WAVE_PATH} fill="url(#emerald-header-gradient)" />
      )}
      <Circle cx="420" cy="40" r="120" fill="none" stroke={stroke} strokeOpacity={0.07} strokeWidth="1.5" />
      <Circle cx="420" cy="40" r="80" fill="none" stroke={stroke} strokeOpacity={0.08} strokeWidth="1.5" />
      <Circle cx="60" cy="200" r="90" fill="none" stroke={stroke} strokeOpacity={0.06} strokeWidth="1.5" />
    </Svg>
  );
}
