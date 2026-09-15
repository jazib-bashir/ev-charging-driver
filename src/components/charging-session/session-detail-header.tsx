import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { theme } from '@/theme';

type SessionDetailHeaderProps = {
  onBack: () => void;
};

export function SessionDetailHeader({ onBack }: SessionDetailHeaderProps) {
  return (
    <View style={styles.container}>
      <IconButton onPress={onBack} accessibilityLabel="Go back" style={styles.sideButton}>
        <Icon name="back" size={22} color={theme.colors.textPrimary} />
      </IconButton>

      <Text style={styles.title}>Session Details</Text>

      <View style={styles.sideButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  sideButton: {
    width: 40,
    height: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
});
