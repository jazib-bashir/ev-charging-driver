import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';
import type { LocationPermissionState } from '@/utils/geolocation';

import { DISCOVERY_LAYOUT } from './discovery-layout';

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
}: LocationPermissionBannerProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (permissionStatus === 'granted') {
    return null;
  }

  const isDenied = permissionStatus === 'denied';

  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Icon name="map-pin" size={14} color={theme.colors.primary} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          Enable location access
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {isDenied
            ? 'Open Settings to allow location access'
            : 'Get distance & nearest stations'}
        </Text>
      </View>

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
          {isDenied ? 'Settings' : isLoading ? '...' : 'Enable'}
        </Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: DISCOVERY_LAYOUT.edge,
      marginTop: DISCOVERY_LAYOUT.sectionGap + 8,
      marginBottom: 0,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
      flexShrink: 0,
      overflow: 'hidden',
    },
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    title: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 11,
      lineHeight: 16.5,
      color: theme.colors.textMuted,
    },
    actionButton: {
      height: 34,
      minWidth: 66,
      paddingHorizontal: 14,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    actionButtonPressed: {
      opacity: 0.9,
    },
    actionButtonDisabled: {
      opacity: 0.7,
    },
    actionButtonText: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.onPrimary,
    },
  });
}
