import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { FeedbackIllustration } from '@/components/brand/illustrations';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type ComingSoonScreenProps = {
  title: string;
};

export function ComingSoonScreen({ title }: ComingSoonScreenProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.header}>
        <IconButton
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          appearance="soft"
        >
          <Icon name="back" size={22} color={theme.colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSide} />
      </View>

      <ScreenContent style={styles.content}>
        <View style={styles.art}>
          <FeedbackIllustration kind="empty" size={96} />
        </View>
        <Text style={styles.title}>Coming soon</Text>
        <Text style={styles.subtitle}>
          {title} will be available in an upcoming konnectEVS update.
        </Text>
      </ScreenContent>
    </ScreenContainer>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.gutter,
      paddingVertical: theme.spacing.md,
    },
    headerSide: {
      width: 40,
      height: 40,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.textPrimary,
      letterSpacing: -0.3,
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xxl,
      gap: theme.spacing.sm,
    },
    art: {
      width: 136,
      height: 136,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: theme.typography.fontSize.xxl,
      letterSpacing: -0.6,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      lineHeight: 22,
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
  });
}
