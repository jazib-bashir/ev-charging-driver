import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { TitleBand } from '@/components/ui/title-band';
import { useTheme } from '@/theme';

type SessionsScreenHeaderProps = {
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

/** Page title band under the shared StationHeader on the Sessions tab. */
export function SessionsScreenHeader(_props: SessionsScreenHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TitleBand contentStyle={styles.content}>
      <Text style={styles.title}>My Sessions</Text>
      <Text style={styles.subtitle}>Charging history and live status</Text>
    </TitleBand>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: 4,
    },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: theme.textStyles.h1.fontSize,
      lineHeight: theme.textStyles.h1.lineHeight,
      letterSpacing: theme.textStyles.h1.letterSpacing,
      color: theme.colors.titleBandText,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      lineHeight: 20,
      color: theme.colors.titleBandTextMuted,
    },
  });
}
