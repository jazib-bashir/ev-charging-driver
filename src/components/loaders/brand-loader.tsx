import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { WeaveLoader } from '@/components/brand/weave-loader';
import { BRAND } from '@/theme/brand';

type BrandLoaderProps = {
  /** Total tile size in dp. The weave occupies ~68% of it. */
  size?: number;
  /**
   * Render the animated Weave on the approved Obsidian tile (default). The Coral/Lime artwork is
   * designed for dark grounds, so the tile keeps it legible on warm, white and emerald surfaces.
   */
  tile?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Core konnectEV loading indicator – the approved animated Weave loader. Page and full-screen
 * loaders (`PageLoader`, `FullScreenLoader`) are built on top of this component.
 */
export function BrandLoader({ size = 56, tile = true, style }: BrandLoaderProps) {
  if (!tile) {
    return (
      <View style={[{ width: size, height: size }, style]}>
        <WeaveLoader size={size} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.3),
        },
        style,
      ]}
    >
      <WeaveLoader size={Math.round(size * 0.7)} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.obsidian,
  },
});
