import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { GridFlowLogo } from '@/components/gridflow-logo';
import { Icon } from '@/components/ui/icon';
import { useTheme, type AppTheme } from '@/theme';

type HomeJourneyLoadingScreenProps = {
  /** True once auth/whoAmI has finished successfully. */
  accountVerified?: boolean;
};

export function HomeJourneyLoadingScreen({
  accountVerified = false,
}: HomeJourneyLoadingScreenProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    pulseLoop.start();
    spinLoop.start();

    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [pulse, spin]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.08],
  });
  const spinRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.screen} accessibilityLabel="Finding your charging journey">
      <View style={styles.header}>
        <GridFlowLogo size={32} variant="mark" />
        <Text style={styles.brand}>GridFlow</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.markWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
          <View style={styles.markCircle}>
            <GridFlowLogo size={72} variant="mark" />
          </View>
        </View>

        <Text style={styles.title}>Finding your charging journey</Text>
        <Text style={styles.subtitle}>Checking your account and active sessions...</Text>
      </View>

      <View style={styles.checklist}>
        <View style={styles.checkRow}>
          {accountVerified ? (
            <View style={styles.checkIcon}>
              <Icon name="check" size={14} color={theme.colors.brand} />
            </View>
          ) : (
            <Animated.View style={{ transform: [{ rotate: spinRotate }] }}>
              <View style={styles.spinnerRing} />
            </Animated.View>
          )}
          <Text
            style={[
              styles.checkLabel,
              accountVerified ? styles.checkLabelDone : styles.checkLabelActive,
            ]}
          >
            {accountVerified ? 'Account verified' : 'Verifying account'}
          </Text>
        </View>

        <View style={styles.checkRow}>
          {accountVerified ? (
            <Animated.View style={{ transform: [{ rotate: spinRotate }] }}>
              <View style={styles.spinnerRing} />
            </Animated.View>
          ) : (
            <View style={styles.checkPending} />
          )}
          <Text
            style={[
              styles.checkLabel,
              accountVerified ? styles.checkLabelActive : styles.checkLabelPending,
            ]}
          >
            Resolving active session
          </Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    brand: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: theme.typography.fontSize.brand,
      lineHeight: theme.typography.lineHeight.brand,
      color: theme.colors.textPrimary,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.xxxl,
    },
    markWrap: {
      width: 140,
      height: 140,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    pulseRing: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 2,
      borderColor: theme.colors.brand,
    },
    markCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.brandMuted,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 280,
    },
    checklist: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    checkIcon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.brandMuted,
    },
    spinnerRing: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: theme.colors.brandMuted,
      borderTopColor: theme.colors.brand,
    },
    checkPending: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    checkLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '600',
    },
    checkLabelDone: {
      color: theme.colors.brandDark,
    },
    checkLabelActive: {
      color: theme.colors.textPrimary,
    },
    checkLabelPending: {
      color: theme.colors.textMuted,
    },
  });
}
