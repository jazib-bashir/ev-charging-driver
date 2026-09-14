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
  showBack?: boolean;
  onBack?: () => void;
};

export function AuthScreenShell({
  title,
  subtitle,
  children,
  footer,
  showBack = true,
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
    <ScreenContainer edges={['top', 'bottom']}>
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
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
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
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  body: {
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  footer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
});
