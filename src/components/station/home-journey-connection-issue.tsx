import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { KonnectEvLogo } from '@/components/brand/konnectev-logo';
import { FeedbackIllustration } from '@/components/brand/illustrations';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme, type AppTheme } from '@/theme';

type HomeJourneyConnectionIssueProps = {
  onRetry: () => void;
  onContinueHome: () => void;
  isRetrying?: boolean;
};

export function HomeJourneyConnectionIssue({
  onRetry,
  onContinueHome,
  isRetrying = false,
}: HomeJourneyConnectionIssueProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <KonnectEvLogo width={132} tone={theme.isDark ? 'onDark' : 'onLight'} />
      </View>

      <View style={styles.center}>
        <View style={styles.card}>
          <FeedbackIllustration kind="offline" size={112} />

          <Text style={styles.eyebrow}>CONNECTION ISSUE</Text>
          <Text style={styles.title}>We couldn’t confirm your session</Text>
          <Text style={styles.body}>
            We won’t assume your session has ended. Check your connection and try again.
          </Text>

          <Button
            label="Retry session check"
            onPress={onRetry}
            loading={isRetrying}
            leadingIcon="refresh"
          />
          <Button
            label="Go to Home for now"
            variant="tertiary"
            onPress={onContinueHome}
            disabled={isRetrying}
          />
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.gutter,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    header: { flexDirection: 'row', alignItems: 'center' },
    center: { flex: 1, justifyContent: 'center', paddingBottom: theme.spacing.xxxl },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: theme.spacing.xl,
      alignItems: 'stretch',
      gap: theme.spacing.md,
      ...(theme.isDark ? theme.shadows.none : theme.shadows.raised),
    },
    eyebrow: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      letterSpacing: 1.3,
      color: theme.colors.warningText,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 24,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.6,
      lineHeight: 30,
    },
    body: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: theme.spacing.sm,
    },
  });
}
