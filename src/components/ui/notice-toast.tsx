import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type NoticeToastProps = {
  message: string;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. */
  duration?: number;
};

export function NoticeToast({ message, onDismiss, duration = 6000 }: NoticeToastProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    const timeoutId = setTimeout(onDismiss, duration);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [onDismiss, duration]);

  return (
    <View style={styles.toast} accessibilityLiveRegion="polite">
      <View style={styles.iconWrap}>
        <Icon name="info" size={18} color={theme.colors.infoText} />
      </View>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={onDismiss}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notice"
      >
        <Icon name="close" size={16} color={theme.colors.textMuted} />
      </Pressable>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceRaised,
      ...(theme.isDark ? theme.shadows.none : theme.shadows.raised),
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 11,
      backgroundColor: theme.colors.infoBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    message: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textPrimary,
      lineHeight: 18,
    },
  });
}
