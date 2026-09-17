import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';
import type { LocationPermissionState } from '@/utils/geolocation';

type LocationPermissionBannerProps = {
  permissionStatus: LocationPermissionState;
  isLoading?: boolean;
  onEnableLocation: () => void;
  onOpenSettings: () => void;
  onDismiss?: () => void;
};

export function LocationPermissionBanner({
  permissionStatus,
  isLoading = false,
  onEnableLocation,
  onOpenSettings,
  onDismiss,
}: LocationPermissionBannerProps) {
  if (permissionStatus === 'granted') {
    return null;
  }

  const isDenied = permissionStatus === 'denied';

  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Icon name="location" size={18} color={theme.colors.brand} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>Enable location access</Text>
        <Text style={styles.subtitle}>
          {isDenied
            ? 'Distance filters and nearby sorting need location access. Open Settings to allow it.'
            : 'Allow location to filter stations by distance and see how far each charger is from you.'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
            isLoading && styles.actionButtonDisabled,
          ]}
          onPress={isDenied ? onOpenSettings : onEnableLocation}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={isDenied ? 'Open location settings' : 'Enable location access'}
        >
          <Text style={styles.actionButtonText}>
            {isDenied ? 'Settings' : isLoading ? 'Enabling...' : 'Enable'}
          </Text>
        </Pressable>

        {onDismiss && !isDenied ? (
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Dismiss location prompt"
          >
            <Icon name="close" size={16} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.selectionBorder,
    backgroundColor: theme.colors.brandMuted,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  actions: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    flexShrink: 0,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
  },
  actionButtonPressed: {
    opacity: 0.9,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textInverse,
  },
});
