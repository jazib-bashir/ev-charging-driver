import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ScreenContainer } from '@/components/ui/screen-container';
import { theme } from '@/theme';

type AuthScreenShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Rendered outside the scroll area, pinned above the safe-area bottom. */
  stickyFooter?: ReactNode;
  /** Render children in a flex container instead of a ScrollView (for lists). */
  disableScroll?: boolean;
  /** Optional content rendered between the header and the title (e.g. login illustration). */
  hero?: ReactNode;
  showBack?: boolean;
  showBrandBadge?: boolean;
  /** Centers title/subtitle (used by the OTP verify step). */
  centered?: boolean;
  /**
   * Compact onboarding header — e.g. step="Step 1 of 2", section="Profile".
   * Renders a centered step label + title between back and bolt, matching the vehicle mock.
   */
  headerStep?: string;
  headerSection?: string;
  onBack?: () => void;
};

export function AuthScreenShell({
  title,
  subtitle,
  children,
  footer,
  stickyFooter,
  disableScroll = false,
  hero,
  showBack = true,
  showBrandBadge = false,
  centered = false,
  headerStep,
  headerSection,
  onBack,
}: AuthScreenShellProps) {
  const useStepHeader = Boolean(headerStep);
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {useStepHeader ? (
          <View style={styles.stepHeader}>
            {showBack ? (
              <Pressable
                onPress={handleBack}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.headerButton}
              >
                <Icon name="back" size={22} color={theme.colors.textPrimary} />
              </Pressable>
            ) : (
              <View style={styles.headerButtonSpacer} />
            )}

            <View style={styles.stepHeaderCenter} pointerEvents="none">
              <Text style={styles.stepMeta} numberOfLines={1}>
                <Text style={styles.stepMetaAccent}>{headerStep}</Text>
                {headerSection ? (
                  <Text style={styles.stepMetaMuted}>
                    {'  •  '}
                    {headerSection}
                  </Text>
                ) : null}
              </Text>
              <Text style={styles.stepTitle} numberOfLines={2}>
                {title}
              </Text>
            </View>

            <View style={styles.headerButton} accessibilityRole="image">
              <Icon name="bolt" size={18} color={theme.colors.brand} />
            </View>
          </View>
        ) : (
          <View style={styles.header}>
            {showBack ? (
              <Pressable
                onPress={handleBack}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.headerButton}
              >
                <Icon name="back" size={22} color={theme.colors.textPrimary} />
              </Pressable>
            ) : (
              <View style={styles.headerButtonSpacer} />
            )}

            {showBrandBadge ? (
              <View style={styles.brandBadge} accessibilityRole="text">
                <Icon name="bolt" size={14} color={theme.colors.brand} />
                <Text style={styles.brandBadgeText}>GRIDFLOW</Text>
              </View>
            ) : (
              <View style={styles.headerButtonSpacer} />
            )}
          </View>
        )}

        {disableScroll ? (
          <View style={styles.staticContent}>
            {subtitle ? (
              <Text
                style={[
                  styles.subtitle,
                  centered && styles.subtitleCentered,
                  useStepHeader ? styles.subtitleAfterStepHeader : null,
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
            <View style={styles.staticBody}>{children}</View>
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.content,
              footer ? styles.contentWithFooter : null,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View>
              {hero ? <View style={styles.hero}>{hero}</View> : null}
              {useStepHeader ? null : (
                <Text style={[styles.title, centered && styles.titleCentered]}>
                  {title}
                </Text>
              )}
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitle,
                    centered && styles.subtitleCentered,
                    useStepHeader ? styles.subtitleAfterStepHeader : null,
                  ]}
                >
                  {subtitle}
                </Text>
              ) : null}
              <View
                style={[
                  styles.body,
                  useStepHeader ? styles.bodyAfterStepHeader : null,
                ]}
              >
                {children}
              </View>
            </View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </ScrollView>
        )}

        {stickyFooter ? (
          <View style={styles.stickyFooter}>{stickyFooter}</View>
        ) : null}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.surface,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    minHeight: 56,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerButtonSpacer: {
    width: 40,
    height: 40,
  },
  stepHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  stepMeta: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  stepMetaAccent: {
    color: theme.colors.brand,
  },
  stepMetaMuted: {
    color: theme.colors.textMuted,
  },
  stepTitle: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.brandMuted,
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.brand,
    letterSpacing: 0.8,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  contentWithFooter: {
    justifyContent: 'space-between',
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  staticBody: {
    flex: 1,
  },
  stickyFooter: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  hero: {
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  titleCentered: {
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
    lineHeight: 22,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  subtitleCentered: {
    textAlign: 'center',
  },
  subtitleAfterStepHeader: {
    marginTop: 0,
    marginBottom: theme.spacing.lg,
  },
  body: {
    gap: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  bodyAfterStepHeader: {
    marginTop: 0,
    gap: theme.spacing.md,
  },
  footer: {
    marginTop: theme.spacing.xxl,
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
});
