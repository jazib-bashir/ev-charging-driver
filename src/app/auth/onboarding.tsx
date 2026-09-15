import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthApiError, updateDriverProfile } from '@/api/auth';
import { useAuth } from '@/auth/auth-context';
import {
  formatPkLocalDisplay,
  fromE164PkToLocal,
  isValidEmail,
  PAKISTAN_DIAL_CODE,
  splitFullName,
} from '@/auth/auth-helpers';
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

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didPrefill, setDidPrefill] = useState(false);

  useEffect(() => {
    if (didPrefill || !user) {
      return;
    }

    if (user.name?.trim()) {
      const parts = splitFullName(user.name);
      setFirstName(parts.firstName);
      setLastName(parts.lastName === parts.firstName ? '' : parts.lastName);
    }
    if (user.email?.trim()) {
      setEmail(user.email.trim());
    }
    if (user.phoneNumber?.trim()) {
      setPhoneLocal(fromE164PkToLocal(user.phoneNumber));
    }
    setDidPrefill(true);
  }, [user, didPrefill]);

  const lockedPhoneDisplay = phoneLocal
    ? `${PAKISTAN_DIAL_CODE} ${formatPkLocalDisplay(phoneLocal)}`
    : '';

  const isValid = useMemo(() => {
    const trimmedEmail = email.trim();
    return (
      firstName.trim().length >= 1 &&
      lastName.trim().length >= 1 &&
      (!trimmedEmail || isValidEmail(trimmedEmail))
    );
  }, [firstName, lastName, email]);

  const handleBack = () => {
    if (isSubmitting) {
      return;
    }

    if (isEditMode) {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace('/(tabs)/profile' as Href);
      return;
    }

    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleSkip = () => {
    if (isSubmitting) {
      return;
    }

    router.replace({
      pathname: '/',
      params: { notice: 'profile-incomplete' },
    } as Href);
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    let hasError = false;

    if (trimmedFirstName.length < 1) {
      setFirstNameError('Enter your first name');
      hasError = true;
    } else {
      setFirstNameError(null);
    }

    if (trimmedLastName.length < 1) {
      setLastNameError('Enter your last name');
      hasError = true;
    } else {
      setLastNameError(null);
    }

    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
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
      await updateDriverProfile(token, {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
        phoneNumber: user?.phoneNumber?.trim() || null,
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
      headerStep={isEditMode ? undefined : 'Step 1 of 2'}
      headerSection={isEditMode ? undefined : 'Profile'}
      onBack={handleBack}
    >
      <View style={styles.fields}>
        <AuthTextField
          label="First name"
          value={firstName}
          onChangeText={(value) => {
            setFirstName(value);
            if (firstNameError) {
              setFirstNameError(null);
            }
            clearStatus();
          }}
          placeholder="First name"
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          editable={!isSubmitting}
          error={firstNameError}
        />
        <AuthTextField
          label="Last name"
          value={lastName}
          onChangeText={(value) => {
            setLastName(value);
            if (lastNameError) {
              setLastNameError(null);
            }
            clearStatus();
          }}
          placeholder="Last name"
          autoCapitalize="words"
          autoComplete="family-name"
          textContentType="familyName"
          editable={!isSubmitting}
          error={lastNameError}
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
        <AuthTextField
          label="Phone"
          value={lockedPhoneDisplay}
          placeholder={`${PAKISTAN_DIAL_CODE} 3XX XXXXXXX`}
          editable={false}
          accessibilityLabel="Phone number"
        />
      </View>

      <RequestStatusBanner status={status} />

      <View style={styles.actions}>
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
            style={styles.skipButton}
          >
            <Text
              style={[styles.skipLabel, isSubmitting && styles.skipDisabled]}
            >
              Skip for now
            </Text>
          </Pressable>
        ) : null}
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: theme.spacing.md,
  },
  actions: {
    marginTop: theme.spacing.sm,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  skipLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  skipDisabled: {
    opacity: 0.45,
  },
});
