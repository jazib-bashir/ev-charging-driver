import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { TitleBand } from '@/components/ui/title-band';
import { useTheme, type AppTheme } from '@/theme';

import { DISCOVERY_LAYOUT } from './discovery-layout';

/**
 * Idle Home hero copy: overline → title → subtitle.
 * Emerald title band with the Login decorative art under StationHeader.
 */
export function DiscoveryHeroIntro() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TitleBand contentStyle={styles.content}>
      <Text style={styles.eyebrow}>FIND YOUR NEXT CHARGE</Text>
      <Text style={styles.title}>Where are you headed?</Text>
      <Text style={styles.subtitle}>See live charger and queue availability nearby.</Text>
    </TitleBand>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: DISCOVERY_LAYOUT.edge,
    },
    eyebrow: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: theme.typography.fontSize.xs,
      letterSpacing: 1.3,
      color: theme.colors.titleBandText,
      marginBottom: 6,
    },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: theme.textStyles.h1.fontSize,
      lineHeight: theme.textStyles.h1.lineHeight,
      letterSpacing: theme.textStyles.h1.letterSpacing,
      color: theme.colors.titleBandText,
      marginBottom: 6,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      lineHeight: 20,
      color: theme.colors.titleBandTextMuted,
    },
  });
}
