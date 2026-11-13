import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconBadge } from '@/components/ui/icon-badge';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

export function MapExpoGoNotice() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <IconBadge name="map" tone="info" size={36} />
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

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: theme.spacing.md,
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      ...theme.shadows.card,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textPrimary,
    },
    message: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textMuted,
      lineHeight: 16,
    },
  });
}
