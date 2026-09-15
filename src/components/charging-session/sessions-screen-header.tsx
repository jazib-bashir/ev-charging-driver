import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';

type SessionsScreenHeaderProps = {
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function SessionsScreenHeader({
  onRefresh,
  isRefreshing = false,
}: SessionsScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleCopy}>
        <Text style={styles.title}>My Charging Sessions</Text>
        <Text style={styles.subtitle}>History and real-time charging status</Text>
      </View>

      <Pressable
        style={styles.refreshButton}
        accessibilityRole="button"
        accessibilityLabel="Refresh sessions"
        disabled={isRefreshing}
        onPress={onRefresh}
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color={theme.colors.textMuted} />
        ) : (
          <Icon name="refresh" size={18} color={theme.colors.textMuted} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  titleCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: theme.typography.fontSize.brand,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: theme.typography.lineHeight.tight,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.iconBackground,
    marginTop: 2,
  },
});
