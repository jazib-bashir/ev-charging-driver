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
  /** Optional content rendered between the header and the title (e.g. login illustration). */
  hero?: ReactNode;
  showBack?: boolean;
  showBrandBadge?: boolean;
  /** Centers title/subtitle (used by the OTP verify step). */
  centered?: boolean;
  onBack?: () => void;
};

export function AuthScreenShell({
  title,
  subtitle,
  children,
  footer,
  hero,
  showBack = true,
  showBrandBadge = false,
  centered = false,
  onBack,
}: AuthScreenShellProps) {
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
        <View style={styles.header}>
          {showBack ? (
            <Pressable
              onPress={handleBack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
            >
              <Icon name="back" size={22} color={theme.colors.textPrimary} />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}

          {showBrandBadge ? (
            <View style={styles.brandBadge} accessibilityRole="text">
              <Icon name="bolt" size={14} color={theme.colors.brand} />
              <Text style={styles.brandBadgeText}>GRIDFLOW</Text>
            </View>
          ) : null}
        </View>

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
            <Text style={[styles.title, centered && styles.titleCentered]}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, centered && styles.subtitleCentered]}>
                {subtitle}
              </Text>
            ) : null}
            <View style={styles.body}>{children}</View>
          </View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backPlaceholder: {
    height: 40,
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  contentWithFooter: {
    justifyContent: 'space-between',
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
  body: {
    gap: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  footer: {
    marginTop: theme.spacing.xxl,
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
});
