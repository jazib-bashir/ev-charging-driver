import { useMemo, type ReactNode } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Set false on root tabs. Defaults to a back button that pops the stack. */
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Standard top bar for pushed screens: soft back button, Space Grotesk title, optional action. */
export function ScreenHeader({ title, subtitle, showBack = true, onBack, right, style }: ScreenHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={[styles.bar, style]}>
      {showBack ? (
        <IconButton appearance="soft" size={44} onPress={handleBack} accessibilityLabel="Go back">
          <Icon name="back" size={22} color={theme.colors.textPrimary} />
        </IconButton>
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.gutter,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.lg,
    },
    spacer: { width: 44, height: 44 },
    center: { flex: 1, alignItems: 'center' },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 16,
      letterSpacing: -0.4,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textMuted,
      marginTop: 1,
    },
  });
}
