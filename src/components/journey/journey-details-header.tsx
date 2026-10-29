import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { JOURNEY_DETAILS_GUTTER } from '@/components/journey/journey-details-layout';
import { Icon } from '@/components/ui/icon';
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
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Icon name="back" size={20} color={theme.colors.textPrimary} />
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          Journey details
        </Text>
        <View style={styles.sideSpacer} />
      </View>

      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>{liveLabel}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      paddingBottom: 8,
    },
    row: {
      minHeight: 52,
      paddingHorizontal: JOURNEY_DETAILS_GUTTER,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.iconBackground,
    },
    sideSpacer: {
      width: 40,
      height: 40,
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      paddingHorizontal: 8,
    },
    liveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      paddingHorizontal: JOURNEY_DETAILS_GUTTER,
      minHeight: 18,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.brand,
    },
    liveText: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 11,
      color: theme.colors.textMuted,
    },
  });
}
