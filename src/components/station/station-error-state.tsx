import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type StationErrorStateProps = {
  onRetry: () => void;
};

export function StationErrorState({ onRetry }: StationErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unable to load stations</Text>
      <Text style={styles.message}>Please check your connection and try again.</Text>
      <Pressable
        style={styles.button}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry loading stations"
      >
        <Text style={styles.buttonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxxl,
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  button: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textInverse,
  },
});
