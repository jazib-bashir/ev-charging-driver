import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { JOURNEY_DETAILS_GUTTER } from '@/components/journey/journey-details-layout';
import { Badge } from '@/components/ui/badge';
import { ScreenHeader } from '@/components/ui/screen-header';
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
    <ScreenHeader
      title="Journey details"
      onBack={onBack}
      right={
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
      marginRight: JOURNEY_DETAILS_GUTTER - 16 > 0 ? JOURNEY_DETAILS_GUTTER - 16 : 0,
    },
  });
}
