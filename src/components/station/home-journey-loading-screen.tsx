import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { KonnectEvLogo } from '@/components/brand/konnectev-logo';
import { WeaveLoader } from '@/components/brand/weave-loader';
import { ButtonLoader } from '@/components/loaders/button-loader';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTheme, type AppTheme } from '@/theme';

type HomeJourneyLoadingScreenProps = {
  /** True once auth/whoAmI has finished successfully. */
  accountVerified?: boolean;
};

/** Journey lookup splash: Weave loader hero with a two-step account / session checklist. */
export function HomeJourneyLoadingScreen({
  accountVerified = false,
}: HomeJourneyLoadingScreenProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.screen} accessibilityLabel="Finding your charging journey">
      <View style={styles.header}>
        <KonnectEvLogo width={132} tone={theme.isDark ? 'onDark' : 'onLight'} />
      </View>

      <View style={styles.center}>
        <View style={styles.markTile}>
          <WeaveLoader size={64} />
        </View>

        <Text style={styles.title}>Finding your charging journey</Text>
        <Text style={styles.subtitle}>Checking your account and active sessions…</Text>
      </View>

      <View style={styles.checklist}>
        <View style={styles.checkRow}>
          {accountVerified ? (
            <View style={styles.checkIcon}>
              <Icon name="check" size={14} color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.checkSlot}>
              <ButtonLoader size={22} />
            </View>
          )}
          <Text style={[styles.checkLabel, accountVerified ? styles.checkLabelDone : styles.checkLabelActive]}>
            {accountVerified ? 'Account verified' : 'Verifying account'}
          </Text>
        </View>

        <View style={styles.checkRow}>
          {accountVerified ? (
            <View style={styles.checkSlot}>
              <ButtonLoader size={22} />
            </View>
          ) : (
            <View style={styles.checkPending} />
          )}
          <Text style={[styles.checkLabel, accountVerified ? styles.checkLabelActive : styles.checkLabelPending]}>
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
      paddingHorizontal: theme.spacing.gutter,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    header: { flexDirection: 'row', alignItems: 'center' },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.xxxl,
    },
    markTile: {
      width: 112,
      height: 112,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.heroBackground,
      marginBottom: theme.spacing.md,
      ...theme.shadows.raised,
    },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 24,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.6,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 280,
    },
    checklist: {
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    checkIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },
    checkSlot: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
    checkPending: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginHorizontal: 2,
    },
    checkLabel: { fontFamily: theme.typography.fontFamily.semibold, fontSize: theme.typography.fontSize.sm },
    checkLabelDone: { color: theme.colors.successText },
    checkLabelActive: { color: theme.colors.textPrimary },
    checkLabelPending: { color: theme.colors.textMuted },
  });
}
