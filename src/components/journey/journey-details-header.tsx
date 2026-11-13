import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenHero } from '@/components/layout/screen-hero';
import { Badge } from '@/components/ui/badge';
import { useTheme, type AppTheme } from '@/theme';

type JourneyDetailsHeaderProps = {
  onBack: () => void;
  liveLabel?: string;
};

export function JourneyDetailsHeader({
  onBack,
  liveLabel = 'Live · updated just now',
}: JourneyDetailsHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScreenHero
      title="Journey details"
      onBack={onBack}
      trailing={
        <View style={styles.live}>
          <Badge label={liveLabel} variant="available" showDot />
        </View>
      }
    />
  );
}

function createStyles(_theme: AppTheme) {
  return StyleSheet.create({
    live: {
      maxWidth: 160,
    },
  });
}
