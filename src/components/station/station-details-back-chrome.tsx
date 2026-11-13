import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';

const LAYOUT_EDGE = 20;

type StationDetailsBackChromeProps = {
  onBack: () => void;
  /**
   * `overlay` — absolute over a hero (loading skeleton).
   * `bar` — in-flow top strip for error / not-found (no hero image).
   */
  placement?: 'overlay' | 'bar';
};

/** Back-only chrome matching the loaded station photo hero (no title, no AppHeader). */
export function StationDetailsBackChrome({
  onBack,
  placement = 'bar',
}: StationDetailsBackChromeProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const topPad = Math.max(insets.top, 12);
  const isOverlay = placement === 'overlay';

  return (
    <View
      style={[
        styles.chrome,
        isOverlay ? styles.overlay : styles.bar,
        { paddingTop: topPad },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.iconButton,
          pressed && styles.iconButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={6}
      >
        <Icon name="back" size={22} color={theme.colors.heroText} />
      </Pressable>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    chrome: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: LAYOUT_EDGE,
      paddingBottom: 8,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2,
    },
    bar: {
      backgroundColor: theme.colors.background,
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(13, 17, 23, 0.55)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.22)',
    },
    iconButtonPressed: {
      opacity: 0.85,
    },
  });
}
