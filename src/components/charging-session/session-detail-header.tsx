import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenHero } from '@/components/layout/screen-hero';
import { Icon } from '@/components/ui/icon';
import { useTheme, type AppTheme } from '@/theme';

type SessionDetailHeaderProps = {
  onBack: () => void;
};

export function SessionDetailHeader({ onBack }: SessionDetailHeaderProps) {
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
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
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
  });
}
