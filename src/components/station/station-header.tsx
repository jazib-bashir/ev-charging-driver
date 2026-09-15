import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { theme } from '@/theme';

type StationHeaderProps = {
  variant?: 'default' | 'map';
  onBack?: () => void;
};

export function StationHeader({ variant = 'default', onBack }: StationHeaderProps) {
  const isMap = variant === 'map';

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
        <IconButton accessibilityLabel="Quick actions">
          <Icon name="bolt" size={18} color={theme.colors.brand} />
        </IconButton>
      )}

      <Text style={styles.brand}>{isMap ? 'Station Map' : 'GridFlow'}</Text>

      <IconButton accessibilityLabel="Notifications">
        <Icon name="bell" size={20} color={theme.colors.brand} />
        <View style={styles.notificationDot} />
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.iconBackground,
  },
  brand: {
    fontSize: theme.typography.fontSize.brand,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.brand,
    letterSpacing: -0.3,
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.notification,
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
  },
});
