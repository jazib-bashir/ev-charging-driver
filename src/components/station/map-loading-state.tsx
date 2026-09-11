import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

export function MapLoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.selectionForeground} />
      <Text style={styles.label}>Loading stations on map...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
  },
});
