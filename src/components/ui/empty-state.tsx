import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { useTheme } from '@/theme';

type EmptyStateProps = {
  title: string;
  message?: string;
  iconName?: IconName;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export function EmptyState({
  title,
  message,
  iconName = 'search-off',
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hasActions = Boolean(primaryActionLabel || secondaryActionLabel);

  return (
    <View style={styles.container}>
      {hasActions && (
        <View style={styles.iconCircle}>
          <Icon name={iconName} size={64} color={theme.colors.textMuted} />
        </View>
      )}

      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {hasActions && (
        <View style={styles.actionsContainer}>
          {primaryActionLabel && onPrimaryAction ? (
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={onPrimaryAction}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>{primaryActionLabel}</Text>
            </Pressable>
          ) : null}

          {secondaryActionLabel && onSecondaryAction ? (
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
              onPress={onSecondaryAction}
              accessibilityRole="button"
            >
              <Icon name="locate" size={18} color={theme.colors.textPrimary} />
              <Text style={styles.secondaryButtonText}>{secondaryActionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxxl,
      gap: theme.spacing.sm,
    },
    iconCircle: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: theme.colors.iconBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    message: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      maxWidth: 290,
      lineHeight: 20,
      marginBottom: theme.spacing.md,
    },
    actionsContainer: {
      width: '100%',
      maxWidth: 340,
      gap: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    primaryButton: {
      backgroundColor: theme.colors.brandDark,
      paddingVertical: 14,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonPressed: {
      opacity: 0.9,
    },
    primaryButtonText: {
      color: theme.colors.textInverse,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    secondaryButton: {
      backgroundColor: theme.colors.surface,
      paddingVertical: 14,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    secondaryButtonPressed: {
      backgroundColor: theme.colors.borderLight,
    },
    secondaryButtonText: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });
}
