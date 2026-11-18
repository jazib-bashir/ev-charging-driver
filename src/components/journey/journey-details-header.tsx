import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenHero } from '@/components/layout/screen-hero';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { useTheme, type AppTheme } from '@/theme';

type JourneyDetailsHeaderProps = {
  onBack: () => void;
  liveLabel?: string;
};

export function JourneyDetailsHeader({
  onBack,
  liveLabel = 'Live · updated just now',
}: JourneyDetailsHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View>
      <ScreenHero />
      <View style={styles.toolbar}>
        <Pressable
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Icon name="back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <View style={styles.live}>
          <Badge label={liveLabel} variant="available" showDot />
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.gutter,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xs,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    live: {
      maxWidth: 160,
    },
  });
}
