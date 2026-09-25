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
  onBack?: () => void;
};

export function StationHeader({ variant = 'default', onBack }: StationHeaderProps) {
  const { theme } = useTheme();
  const isMap = variant === 'map';
  const styles = useMemo(() => createStyles(theme), [theme]);

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
          <Icon name="back" size={20} color={theme.colors.textPrimary} />
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
        <Icon name="bell" size={18} color={theme.colors.textPrimary} />
        <View style={styles.notificationDot} />
      </IconButton>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: DISCOVERY_LAYOUT.edge,
      paddingTop: DISCOVERY_LAYOUT.sectionGap,
      paddingBottom: 0,
      minHeight: 44,
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
      color: theme.colors.textPrimary,
      letterSpacing: 0,
    },
    mapTitle: {
      flex: 1,
      marginLeft: 8,
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.lg,
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
      width: 32,
      height: 32,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
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
      borderColor: theme.colors.background,
    },
  });
}
