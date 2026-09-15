import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';

type NoticeToastProps = {
  message: string;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. */
  duration?: number;
};

export function NoticeToast({
  message,
  onDismiss,
  duration = 6000,
}: NoticeToastProps) {
  useEffect(() => {
    const timeoutId = setTimeout(onDismiss, duration);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [onDismiss, duration]);

  return (
    <View style={styles.toast} accessibilityLiveRegion="polite">
      <Icon name="warning" size={18} color={theme.colors.brandDark} />
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

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.selectionBorder,
    backgroundColor: theme.colors.brandMuted,
  },
  message: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.brandDark,
    lineHeight: 18,
  },
});
