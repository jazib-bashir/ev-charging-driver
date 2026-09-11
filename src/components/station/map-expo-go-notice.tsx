import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';

export function MapExpoGoNotice() {
  return (
    <View style={styles.container}>
      <Icon name="map" size={18} color={theme.colors.selectionForeground} />
      <View style={styles.copy}>
        <Text style={styles.title}>Map tiles unavailable in Expo Go</Text>
        <Text style={styles.message}>
          Android Expo Go (SDK 57) cannot load Google Maps tiles. Build an APK with
          EAS to test the map with your API key.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.selectionBorder,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.card,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  message: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
});
