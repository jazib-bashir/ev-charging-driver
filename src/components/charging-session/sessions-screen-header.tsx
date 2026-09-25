import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

type SessionsScreenHeaderProps = {
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function SessionsScreenHeader(_props: SessionsScreenHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Sessions</Text>
      <Text style={styles.subtitle}>Charging history & live status</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      marginTop: 8,
      gap: 2,
    },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 22,
      lineHeight: 33,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.textMuted,
    },
  });
}
