import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GridFlowLogo } from '@/components/gridflow-logo';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { useTheme } from '@/theme';

import { DISCOVERY_LAYOUT } from './discovery-layout';

type StationHeaderProps = {
  variant?: 'default' | 'map';
  /** Dark-mode charging cockpit chrome (white wordmark on teal). */
  appearance?: 'default' | 'charging';
  onBack?: () => void;
};

export function StationHeader({
  variant = 'default',
  appearance = 'default',
  onBack,
}: StationHeaderProps) {
  const { theme } = useTheme();
  const isMap = variant === 'map';
  const isCharging = appearance === 'charging';
  const styles = useMemo(() => createStyles(theme, isCharging), [theme, isCharging]);
  const textColor = isCharging ? '#FFFFFF' : theme.colors.textPrimary;
  const bellColor = isCharging ? '#FFFFFF' : theme.colors.textPrimary;

  const openNotifications = () => {
    router.push('/notifications' as Href);
  };

  return (
    <View style={styles.container}>
      {isMap && onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to station list"
          style={styles.backButton}
        >
          <Icon name="back" size={20} color={textColor} />
        </Pressable>
      ) : (
        <View style={styles.brandRow}>
          <GridFlowLogo size={32} variant="mark" />
          <Text style={styles.brand} accessibilityRole="header">
            GridFlow
          </Text>
        </View>
      )}

      {isMap ? <Text style={styles.mapTitle}>Station Map</Text> : <View style={styles.spacer} />}

      <IconButton
        onPress={openNotifications}
        accessibilityLabel="Notifications"
        style={styles.notificationButton}
      >
        <Icon name="bell" size={18} color={bellColor} />
        <View style={styles.notificationDot} />
      </IconButton>
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  isCharging: boolean,
) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: DISCOVERY_LAYOUT.edge,
      paddingTop: DISCOVERY_LAYOUT.sectionGap,
      paddingBottom: 0,
      minHeight: 44,
      backgroundColor: isCharging ? 'transparent' : undefined,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
    },
    brand: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: theme.typography.fontSize.brand,
      lineHeight: theme.typography.lineHeight.brand,
      color: isCharging ? '#FFFFFF' : theme.colors.textPrimary,
      letterSpacing: 0,
    },
    mapTitle: {
      flex: 1,
      marginLeft: 8,
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 18,
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    spacer: {
      flex: 1,
    },
    backButton: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.iconBackground,
    },
    notificationButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isCharging ? 'rgba(255,255,255,0.18)' : theme.colors.border,
      backgroundColor: isCharging ? 'rgba(0,0,0,0.22)' : theme.colors.surface,
    },
    notificationDot: {
      position: 'absolute',
      top: 4,
      right: 5,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.colors.notification,
      borderWidth: 1.5,
      borderColor: isCharging ? '#0A2F2A' : theme.colors.background,
    },
  });
}
