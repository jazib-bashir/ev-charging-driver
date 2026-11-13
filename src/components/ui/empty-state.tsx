import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { FeedbackIllustration, type FeedbackKind } from '@/components/brand/illustrations';
import { Button } from '@/components/ui/button';
import type { IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type EmptyStateProps = {
  title: string;
  message?: string;
  /** Approved feedback illustration to show (defaults to the empty glyph). */
  kind?: FeedbackKind;
  /** @deprecated Illustrations replace icons; kept so existing callers keep compiling. */
  iconName?: IconName;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** Smaller illustration for inline placement inside lists. */
  compact?: boolean;
};

/**
 * Standard feedback layout: illustration, title, helper text, primary action.
 * `ErrorState` and `OfflineState` are thin presets of this component.
 */
export function EmptyState({
  title,
  message,
  kind = 'empty',
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={[styles.illustration, compact && styles.illustrationCompact]}>
        <FeedbackIllustration kind={kind} size={compact ? 72 : 104} />
      </View>

      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {primaryActionLabel || secondaryActionLabel ? (
        <View style={styles.actions}>
          {primaryActionLabel && onPrimaryAction ? (
            <Button label={primaryActionLabel} onPress={onPrimaryAction} />
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <Button
              label={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="outline"
              leadingIcon="locate"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState(props: Omit<EmptyStateProps, 'kind'>) {
  return <EmptyState kind="error" {...props} />;
}

export function OfflineState(props: Omit<EmptyStateProps, 'kind'>) {
  return <EmptyState kind="offline" {...props} />;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xxl,
      paddingVertical: theme.spacing.xxxl,
      gap: theme.spacing.sm,
    },
    illustration: {
      width: 148,
      height: 148,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
      ...(theme.isDark ? theme.shadows.none : theme.shadows.card),
    },
    illustrationCompact: {
      width: 104,
      height: 104,
      borderRadius: 32,
    },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: -0.5,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    message: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
      lineHeight: 22,
      marginBottom: theme.spacing.md,
    },
    actions: {
      width: '100%',
      maxWidth: 340,
      gap: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
  });
}
