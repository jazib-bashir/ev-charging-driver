import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme, type AppTheme } from '@/theme';

import { DISCOVERY_LAYOUT } from './discovery-layout';

/**
 * Idle Home hero copy (Figma): eyebrow → title → subtitle.
 * Shown when there is no active journey card above search.
 */
export function DiscoveryHeroIntro() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Find your next charge</Text>
      <Text style={styles.title}>Where are you headed?</Text>
      <Text style={styles.subtitle}>
        See live charger and queue availability nearby.
      </Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: DISCOVERY_LAYOUT.edge,
      paddingTop: 20,
      paddingBottom: 4,
    },
    eyebrow: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: theme.colors.brandDark,
      marginBottom: 6,
    },
    title: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 26,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textMuted,
    },
  });
}
