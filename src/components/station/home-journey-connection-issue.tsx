import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GridFlowLogo } from '@/components/gridflow-logo';
import { Icon } from '@/components/ui/icon';
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
        <GridFlowLogo size={32} variant="mark" />
        <Text style={styles.brand}>GridFlow</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon name="wifi-off" size={28} color="#E07A3A" />
          </View>

          <Text style={styles.eyebrow}>Connection issue</Text>
          <Text style={styles.title}>We couldn’t confirm your session</Text>
          <Text style={styles.body}>
            We won’t assume your session has ended. Check your connection and try again.
          </Text>

          <Pressable
            onPress={onRetry}
            disabled={isRetrying}
            accessibilityRole="button"
            accessibilityLabel="Retry session check"
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              isRetrying && styles.primaryDisabled,
            ]}
          >
            {isRetrying ? (
              <ActivityIndicator color={theme.colors.textInverse} />
            ) : (
              <Text style={styles.primaryLabel}>Retry session check</Text>
            )}
          </Pressable>

          <Pressable
            onPress={onContinueHome}
            disabled={isRetrying}
            accessibilityRole="button"
            accessibilityLabel="Go to Home for now"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryLabel}>Go to Home for now</Text>
          </Pressable>
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
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    brand: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: theme.typography.fontSize.brand,
      lineHeight: theme.typography.lineHeight.brand,
      color: theme.colors.textPrimary,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      paddingBottom: theme.spacing.xxxl,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
      alignItems: 'center',
      gap: theme.spacing.sm,
      ...theme.shadows.card,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(224, 122, 58, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: theme.colors.brandDark,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.3,
      lineHeight: 28,
    },
    body: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: theme.spacing.md,
      maxWidth: 300,
    },
    primaryButton: {
      alignSelf: 'stretch',
      backgroundColor: theme.colors.brand,
      borderRadius: theme.radius.md,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    primaryDisabled: {
      opacity: 0.7,
    },
    primaryLabel: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: '700',
      color: theme.colors.textInverse,
    },
    secondaryButton: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    secondaryLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    pressed: {
      opacity: 0.9,
    },
  });
}
