import { StyleSheet, Text } from 'react-native';

import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';
import { theme } from '@/theme';

type ComingSoonScreenProps = {
  title: string;
};

export function ComingSoonScreen({ title }: ComingSoonScreenProps) {
  return (
    <ScreenContainer edges={['top']}>
      <ScreenContent style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
      </ScreenContent>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
  },
});
