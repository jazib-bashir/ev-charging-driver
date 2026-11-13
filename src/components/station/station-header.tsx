import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { KonnectEvLogo } from '@/components/brand/konnectev-logo';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

import { DISCOVERY_LAYOUT } from './discovery-layout';

type StationHeaderProps = {
  variant?: 'default' | 'map';
  /** Obsidian hero chrome (active charging journey): white wordmark, hero-tinted controls. */
  appearance?: 'default' | 'charging';
  onBack?: () => void;
};

/** Shared top nav: approved konnectEV signature on the left, notifications on the right. */
export function StationHeader({
  variant = 'default',
  appearance = 'default',
  onBack,
}: StationHeaderProps) {
  const { theme } = useTheme();
  const isMap = variant === 'map';
  const isCharging = appearance === 'charging';
  const styles = useMemo(() => createStyles(theme, isCharging), [theme, isCharging]);
  const iconColor = isCharging ? theme.colors.heroText : theme.colors.textPrimary;
  const logoTone = isCharging || theme.isDark ? 'onDark' : 'onLight';

  return (
    <View style={styles.container}>
      {isMap && onBack ? (
        <IconButton
          appearance="soft"
          size={40}
          onPress={onBack}
          accessibilityLabel="Back to station list"
        >
          <Icon name="back" size={20} color={iconColor} />
        </IconButton>
      ) : (
        <View accessibilityRole="header">
          <KonnectEvLogo width={132} tone={logoTone} />
        </View>
      )}

      {isMap ? <Text style={styles.mapTitle}>Station Map</Text> : <View style={styles.spacer} />}

      <IconButton
        onPress={() => router.push('/notifications' as Href)}
        accessibilityLabel="Notifications"
        size={36}
        style={styles.notificationButton}
      >
        <Icon name="bell" size={17} color={iconColor} />
        <View style={styles.notificationDot} />
      </IconButton>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], isCharging: boolean) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: DISCOVERY_LAYOUT.edge,
      paddingTop: DISCOVERY_LAYOUT.sectionGap,
      paddingBottom: theme.spacing.sm,
      minHeight: 54,
      backgroundColor: isCharging ? theme.colors.heroBackground : theme.colors.navBarBackground,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isCharging ? theme.colors.heroBorder : theme.colors.border,
    },
    mapTitle: {
      flex: 1,
      marginLeft: 12,
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: theme.typography.fontSize.lg,
      letterSpacing: -0.3,
      color: theme.colors.textPrimary,
    },
    spacer: { flex: 1 },
    notificationButton: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isCharging ? theme.colors.heroBorder : theme.colors.border,
      backgroundColor: isCharging ? theme.colors.heroSurface : theme.colors.surface,
    },
    notificationDot: {
      position: 'absolute',
      top: 7,
      right: 8,
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: theme.colors.notification,
      borderWidth: 1.5,
      borderColor: isCharging ? theme.colors.heroBackground : theme.colors.surface,
    },
  });
}
