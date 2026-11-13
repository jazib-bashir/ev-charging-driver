import {
  ActivityIndicator,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';

type ButtonLoaderProps = {
  /** Spinner diameter in dp (compact by default so buttons keep their height). */
  size?: number;
  /** Contrast color for the spinner; defaults to `textLink`. */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Circular loader for buttons and compact inline busy states.
 * Buttons render this over their (hidden) label so their dimensions never change while loading.
 */
export function ButtonLoader({ size = 22, color, style }: ButtonLoaderProps) {
  const { theme } = useTheme();
  const resolvedColor = color ?? theme.colors.textLink;
  // Android only accepts 'small' | 'large'; iOS accepts a numeric diameter.
  const indicatorSize =
    Platform.OS === 'ios' ? size : size <= 20 ? ('small' as const) : ('large' as const);

  return (
    <ActivityIndicator size={indicatorSize} color={resolvedColor} style={style} />
  );
}
