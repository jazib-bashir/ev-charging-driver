import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AuthApiError, updateDriverProfile } from '@/api/auth';
import { useAuth } from '@/auth/auth-context';
import { isValidEmail, splitFullName } from '@/auth/auth-helpers';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { AuthTextField } from '@/components/auth/auth-text-field';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { theme } from '@/theme';

export default function OnboardingScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const { token, user, refreshUser, pendingBooking } = useAuth();
  const { status, showError, showSuccess, clearStatus } = useRequestStatus(2000);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didPrefill, setDidPrefill] = useState(false);

  useEffect(() => {
    if (didPrefill || !user) {
      return;
    }

    if (user.name?.trim()) {
      setName(user.name.trim());
    }
    if (user.email?.trim()) {
      setEmail(user.email.trim());
    }
    setDidPrefill(true);
  }, [user, didPrefill]);

  const isValid = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    return trimmedName.length >= 2 && isValidEmail(trimmedEmail);
  }, [name, email]);

  const handleSkip = () => {
    if (isSubmitting) {
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/' as Href);
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    let hasError = false;

    if (trimmedName.length < 2) {
      setNameError('Enter your full name');
      hasError = true;
    } else {
      setNameError(null);
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Enter a valid email address');
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (hasError) {
      return;
    }

    if (!token) {
      showError('Your session expired. Please log in again.');
      return;
    }

    clearStatus();
    setIsSubmitting(true);

    try {
      const { firstName, lastName } = splitFullName(trimmedName);
      await updateDriverProfile(token, {
        firstName,
        lastName,
        email: trimmedEmail,
      });
      await refreshUser();

      if (isEditMode) {
        showSuccess('Profile updated successfully.', { persist: true });
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/profile' as Href);
        }
        return;
      }

      showSuccess('Profile saved. Next, select your vehicle.', {
        persist: true,
      });
      router.push({
        pathname: '/auth/vehicles',
        params: pendingBooking?.stationId ? { from: 'booking' } : undefined,
      } as Href);
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : 'Unable to save your profile. Please try again.';
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title={isEditMode ? 'Edit details' : 'Complete your profile'}
      subtitle={
        isEditMode
          ? 'Update your name and email anytime.'
          : 'Tell us a bit about yourself to finish setting up your account.'
      }
      showBack
      onBack={handleSkip}
    >
      <AuthTextField
        label="Name"
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (nameError) {
            setNameError(null);
          }
          clearStatus();
        }}
        placeholder="Your full name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        editable={!isSubmitting}
        error={nameError}
      />
      <AuthTextField
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (emailError) {
            setEmailError(null);
          }
          clearStatus();
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        editable={!isSubmitting}
        error={emailError}
      />

      <RequestStatusBanner status={status} />

      <AuthPrimaryButton
        label={isEditMode ? 'Save' : 'Continue'}
        onPress={() => {
          void handleSubmit();
        }}
        loading={isSubmitting}
        disabled={!isValid || isSubmitting}
      />
      {!isEditMode ? (
        <Pressable
          onPress={handleSkip}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
          style={[styles.skipButton, isSubmitting && styles.skipDisabled]}
        >
          <Text style={styles.skipLabel}>Skip for now</Text>
        </Pressable>
      ) : null}
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  skipButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  skipDisabled: {
    opacity: 0.45,
  },
  skipLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
});
