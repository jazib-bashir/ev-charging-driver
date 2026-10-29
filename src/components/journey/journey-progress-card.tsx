import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useTheme, type AppTheme } from '@/theme';

const STEPS = ['Queue', 'Arrived', 'Ready', 'Charging'] as const;

type JourneyProgressCardProps = {
  currentStepIndex: number;
};

export function JourneyProgressCard({ currentStepIndex }: JourneyProgressCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Journey progress</Text>
      <View style={styles.stepperRow}>
        {STEPS.map((label, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isActive = isComplete || isCurrent;
          const leftActive = index > 0 && index <= currentStepIndex;
          const rightActive = index < currentStepIndex;

          return (
            <View key={label} style={styles.stepSlot}>
              {index > 0 ? (
                <View style={styles.railLeft}>
                  <View
                    style={[styles.railFill, leftActive && styles.railFillActive]}
                  />
                </View>
              ) : null}
              {index < STEPS.length - 1 ? (
                <View style={styles.railRight}>
                  <View
                    style={[styles.railFill, rightActive && styles.railFillActive]}
                  />
                </View>
              ) : null}

              <View
                style={[
                  styles.circle,
                  isActive ? styles.circleActive : styles.circleUpcoming,
                ]}
              >
                {isComplete ? (
                  <Icon name="check" size={12} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.number,
                      isCurrent && styles.numberActive,
                      !isActive && styles.numberUpcoming,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 16,
      gap: 14,
    },
    sectionLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: theme.colors.textMuted,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    stepSlot: {
      flex: 1,
      alignItems: 'center',
      position: 'relative',
    },
    railLeft: {
      position: 'absolute',
      left: 0,
      right: '50%',
      top: 12,
      height: 2,
      paddingRight: 14,
      justifyContent: 'center',
    },
    railRight: {
      position: 'absolute',
      left: '50%',
      right: 0,
      top: 12,
      height: 2,
      paddingLeft: 14,
      justifyContent: 'center',
    },
    railFill: {
      flex: 1,
      height: 2,
      borderRadius: 1,
      backgroundColor: theme.colors.border,
    },
    railFillActive: {
      backgroundColor: theme.colors.brand,
    },
    circle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    circleActive: {
      backgroundColor: theme.colors.brand,
    },
    circleUpcoming: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
    number: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    numberActive: {
      color: '#FFFFFF',
    },
    numberUpcoming: {
      color: theme.colors.textMuted,
    },
    stepLabel: {
      marginTop: 8,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 11,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    stepLabelActive: {
      color: theme.colors.brand,
      fontFamily: theme.typography.fontFamily.semibold,
      fontWeight: '600',
    },
  });
}
