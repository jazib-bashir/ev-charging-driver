import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';

type GridFlowLogoProps = {
  size?: number;
  /** `default` — soft tile + brand bolt. `mark` — accent tile + black bolt icon (headers). */
  variant?: 'default' | 'mark';
};

export function GridFlowLogo({ size = 72, variant = 'default' }: GridFlowLogoProps) {
  const { theme } = useTheme();

  if (variant === 'mark') {
    const iconSize = Math.round(size * 0.5);

    return (
      <View
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: 8,
            backgroundColor: theme.colors.accent,
          },
        ]}
        accessibilityLabel="GridFlow"
      >
        <Icon name="bolt" size={iconSize} color="#000000" />
      </View>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Rect width="512" height="512" rx="112" fill={theme.colors.iconBackground} />
      <Path
        d="M284 84 L144 268 C138 276 144 288 154 288 H252 L228 428 C226 440 240 447 248 438 L388 244 C394 236 388 224 378 224 H280 L304 94 C306 82 292 75 284 84 Z"
        fill={theme.colors.accent}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
