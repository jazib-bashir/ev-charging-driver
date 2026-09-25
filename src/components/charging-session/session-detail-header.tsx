import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';

type SessionDetailHeaderProps = {
  onBack: () => void;
};

export function SessionDetailHeader({ onBack }: SessionDetailHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.backButton}
      >
        <Icon name="back" size={22} color={theme.colors.textPrimary} />
      </Pressable>

      <Text style={styles.title}>Session Details</Text>

      <View style={styles.sideSpacer} />
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      height: 56,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    sideSpacer: {
      width: 40,
      height: 40,
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: theme.typography.fontFamily.brandSemiBold,
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
  });
}
