import { useWindowDimensions, View, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { theme } from '@/theme';

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 148;
/** ~12–13% smaller than the original 148px cap so the form sits higher. */
const MAX_HEIGHT = 128;
const MIN_HEIGHT = 84;

type LoginIllustrationProps = {
  /** Soft cap used on short screens so the form stays above the fold. */
  maxHeightRatio?: number;
  /** Optional fixed size (e.g. logged-out profile centerpiece). */
  width?: number;
  height?: number;
};

/**
 * Compact GridFlow EV-charging hero for the phone login screen.
 * Inspired by the operator desktop Login illustration (charger, route pins, soft terrain).
 */
export function LoginIllustration({
  maxHeightRatio = 0.19,
  width: fixedWidth,
  height: fixedHeight,
}: LoginIllustrationProps) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const responsiveCap = Math.round(windowHeight * maxHeightRatio);
  const height =
    fixedHeight ??
    Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, responsiveCap));
  const width =
    fixedWidth ??
    Math.min(windowWidth - theme.spacing.lg * 2, height * (VIEWBOX_WIDTH / VIEWBOX_HEIGHT));

  return (
    <View
      style={[styles.wrap, { height, width }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#f0fdfa" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="hillBack" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#99f6e4" stopOpacity="0.55" />
            <Stop offset="100%" stopColor="#ccfbf1" stopOpacity="0.2" />
          </LinearGradient>
          <LinearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#5eead4" stopOpacity="0.45" />
            <Stop offset="100%" stopColor="#99f6e4" stopOpacity="0.15" />
          </LinearGradient>
          <LinearGradient id="stationBody" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="100%" stopColor="#f0fdfa" />
          </LinearGradient>
          <LinearGradient id="carBody" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#e2e8f0" />
            <Stop offset="55%" stopColor="#f8fafc" />
            <Stop offset="100%" stopColor="#cbd5e1" />
          </LinearGradient>
          <RadialGradient id="plugGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.55" />
            <Stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="screenGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Soft sky wash */}
        <Rect x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#sky)" />

        {/* Distant terrain */}
        <Path
          d="M0 108 C48 92 86 88 128 96 C168 104 204 118 248 112 C280 108 304 100 320 96 L320 148 L0 148 Z"
          fill="url(#hillBack)"
        />
        <Path
          d="M0 122 C40 112 78 108 118 116 C162 126 198 134 242 128 C278 122 304 118 320 120 L320 148 L0 148 Z"
          fill="url(#hillFront)"
        />

        {/* Network route — dotted feel via short dashes */}
        <Path
          d="M36 78 C72 62 110 58 148 72 C186 86 214 78 248 64"
          stroke="#0d9488"
          strokeWidth="1.5"
          strokeDasharray="3 5"
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
        />
        <Path
          d="M58 96 C96 84 130 90 164 104 C198 118 230 112 268 98"
          stroke="#5eead4"
          strokeWidth="1.25"
          strokeDasharray="2 5"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />

        {/* Map pins */}
        <G transform="translate(52 54)">
          <Path
            d="M0 -14 C7.5 -14 12 -8.5 12 0 C12 8 -0 18 0 18 C0 18 -12 8 -12 0 C-12 -8.5 -7.5 -14 0 -14 Z"
            fill="#0d9488"
            opacity="0.9"
          />
          <Circle cx="0" cy="-2" r="3.5" fill="#ecfdf5" />
        </G>
        <G transform="translate(248 48)">
          <Path
            d="M0 -11 C5.8 -11 9.5 -6.5 9.5 0 C9.5 6 0 14 0 14 C0 14 -9.5 6 -9.5 0 C-9.5 -6.5 -5.8 -11 0 -11 Z"
            fill="#14b8a6"
            opacity="0.85"
          />
          <Circle cx="0" cy="-1.5" r="2.8" fill="#ecfdf5" />
        </G>
        <G transform="translate(168 58)">
          <Path
            d="M0 -8 C4.2 -8 7 -4.8 7 0 C7 4.5 0 10.5 0 10.5 C0 10.5 -7 4.5 -7 0 C-7 -4.8 -4.2 -8 0 -8 Z"
            fill="#5eead4"
            opacity="0.9"
          />
          <Circle cx="0" cy="-1" r="2.2" fill="#f0fdfa" />
        </G>

        {/* Charging station */}
        <G transform="translate(118 28)">
          <Ellipse cx="18" cy="96" rx="22" ry="5" fill="#0d9488" opacity="0.1" />
          <Rect
            x="4"
            y="8"
            width="28"
            height="88"
            rx="8"
            fill="url(#stationBody)"
            stroke="#ccfbf1"
            strokeWidth="1.5"
          />
          {/* Screen glow */}
          <Ellipse cx="18" cy="36" rx="18" ry="16" fill="url(#screenGlow)" />
          <Rect x="9" y="22" width="18" height="26" rx="4" fill="#0d9488" />
          {/* Bolt */}
          <Path
            d="M20 26 L14 38 H18.5 L16.5 46 L24 33 H19.5 Z"
            fill="#ecfdf5"
          />
          {/* Side port */}
          <Rect x="30" y="58" width="6" height="10" rx="2" fill="#99f6e4" />
          {/* Status dots */}
          <Circle cx="12" cy="58" r="2" fill="#5eead4" />
          <Circle cx="18" cy="58" r="2" fill="#99f6e4" />
          <Circle cx="24" cy="58" r="2" fill="#ccfbf1" />
        </G>

        {/* Cable from station to car */}
        <Path
          d="M148 88 C168 100 188 108 208 102 C220 98 228 92 236 86"
          stroke="#334155"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />
        <Path
          d="M148 88 C168 100 188 108 208 102 C220 98 228 92 236 86"
          stroke="#0f766e"
          strokeWidth="1.25"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />

        {/* Plug glow + handle */}
        <Circle cx="238" cy="84" r="14" fill="url(#plugGlow)" />
        <Rect x="230" y="78" width="16" height="10" rx="3" fill="#1e293b" />
        <Rect x="242" y="80" width="8" height="6" rx="1.5" fill="#94a3b8" />
        <Circle cx="248" cy="83" r="2.5" fill="#2dd4bf" opacity="0.9" />

        {/* Compact EV silhouette */}
        <G transform="translate(214 78)">
          <Ellipse cx="42" cy="42" rx="40" ry="6" fill="#0d9488" opacity="0.08" />
          <Path
            d="M12 34 C16 18 28 10 48 10 C68 10 78 18 84 28 L92 34 C94 36 94 40 90 42 L8 42 C4 40 4 36 6 34 Z"
            fill="url(#carBody)"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          {/* Cabin glass */}
          <Path
            d="M28 18 C34 14 44 12 54 12 C64 12 72 15 76 22 L70 28 H32 Z"
            fill="#99f6e4"
            opacity="0.55"
          />
          {/* Accent stripe */}
          <Path
            d="M18 30 H82"
            stroke="#0d9488"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.35"
          />
          {/* Wheels */}
          <Circle cx="28" cy="42" r="7" fill="#1e293b" />
          <Circle cx="28" cy="42" r="3" fill="#64748b" />
          <Circle cx="72" cy="42" r="7" fill="#1e293b" />
          <Circle cx="72" cy="42" r="3" fill="#64748b" />
          {/* Charge port highlight */}
          <Rect x="8" y="28" width="5" height="6" rx="1.5" fill="#14b8a6" />
        </G>

        {/* Soft ground highlight under composition */}
        <Ellipse
          cx="160"
          cy="138"
          rx="110"
          ry="6"
          fill="#0d9488"
          opacity="0.05"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    marginTop: theme.spacing.xxs,
    marginBottom: theme.spacing.xs,
  },
});
