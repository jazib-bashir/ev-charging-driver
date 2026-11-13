import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { EmeraldHeaderArt } from '@/components/brand/emerald-header-art';
import { useTheme } from '@/theme';

type TitleBandProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Emerald title strip under StationHeader: Login decorative art + readable on-band content.
 * Background uses `titleBandBackground` / gradient tokens; top nav stays on `navBarBackground`.
 */
export function TitleBand({ children, style, contentStyle }: TitleBandProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.band, style]}>
      <EmeraldHeaderArt rectangular />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    band: {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: theme.colors.titleBandBackground,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.titleBandBorder,
    },
    content: {
      position: 'relative',
      zIndex: 1,
      paddingHorizontal: theme.spacing.gutter,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
  });
}
