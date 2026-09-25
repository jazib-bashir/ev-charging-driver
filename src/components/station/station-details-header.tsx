import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { useTheme } from '@/theme';

type StationDetailsHeaderProps = {
  onBack: () => void;
  onShare?: () => void;
};

export function StationDetailsHeader({ onBack, onShare }: StationDetailsHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <IconButton
        onPress={onBack}
        accessibilityLabel="Go back"
        style={styles.sideButton}
      >
        <Icon name="back" size={22} color={theme.colors.textPrimary} />
      </IconButton>

      <Text style={styles.title}>Station Details</Text>

      <IconButton
        onPress={onShare}
        accessibilityLabel="Share station"
        style={styles.sideButton}
      >
        <Icon name="share" size={20} color={theme.colors.textPrimary} />
      </IconButton>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
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
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
  });
}
