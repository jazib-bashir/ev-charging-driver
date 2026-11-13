import type { StyleProp, ViewStyle } from 'react-native';

import { BrandLoader } from './brand-loader';

type ButtonLoaderProps = {
  /** Tile size in dp (compact by default so buttons keep their height). */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Compact branded loader for use inside buttons ("buttons and inline loading use the small mark").
 * Buttons render this over their (hidden) label so their dimensions never change while loading.
 */
export function ButtonLoader({ size = 26, style }: ButtonLoaderProps) {
  return <BrandLoader size={size} style={style} />;
}
