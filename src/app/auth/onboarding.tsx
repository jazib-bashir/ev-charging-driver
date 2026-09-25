import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

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
import { Icon } from '@/components/ui/icon';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useTheme } from '@/theme';

type InFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  isLast?: boolean;
  styles: ReturnType<typeof createEditStyles>;
};

function InField({
  label,
  error,
  isLast = false,
  styles,
  editable = true,
  ...props
}: InFieldProps) {
  const { theme } = useTheme();

  return (
    <View>
      <View style={[styles.fieldBlock, !isLast && styles.fieldDivider]}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={[
            styles.fieldInput,
            !editable ? styles.fieldInputDisabled : null,
          ]}
          placeholderTextColor={theme.colors.textMuted}
          editable={editable}
          {...props}
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function OnboardingScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const { theme, isDark } = useTheme();
  const editStyles = useMemo(
    () => createEditStyles(theme, isDark),
    [theme, isDark],
  );
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

  const formFields = (
    <View style={editStyles.formCard}>
      <InField
        styles={editStyles}
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
      <InField
        styles={editStyles}
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
      <InField
        styles={editStyles}
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
      <InField
        styles={editStyles}
        label="Phone"
        value={lockedPhoneDisplay}
        placeholder={`${PAKISTAN_DIAL_CODE} 3XX XXXXXXX`}
        editable={false}
        accessibilityLabel="Phone number"
        isLast
      />
    </View>
  );

  if (isEditMode) {
    return (
      <ScreenContainer edges={['top', 'bottom']} style={editStyles.screen}>
        <KeyboardAvoidingView
          style={editStyles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={editStyles.headerBar}>
            <Pressable
              onPress={handleBack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={editStyles.backButton}
            >
              <Icon name="back" size={22} color={theme.colors.textPrimary} />
            </Pressable>
            <Text style={editStyles.headerTitle} numberOfLines={1}>
              Edit details
            </Text>
            <View style={editStyles.headerSpacer} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={editStyles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={editStyles.subtitle}>
              Update your name and email anytime.
            </Text>

            {formFields}

            <RequestStatusBanner status={status} />

            <AuthPrimaryButton
              label="Save"
              onPress={() => {
                void handleSubmit();
              }}
              loading={isSubmitting}
              disabled={!isValid || isSubmitting}
              style={editStyles.saveButton}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  return (
    <AuthScreenShell
      title="Complete your profile"
      subtitle="Tell us a bit about yourself to finish setting up your account."
      showBack
      headerStep="Step 1 of 2"
      headerSection="Profile"
      onBack={handleBack}
    >
      {formFields}

      <RequestStatusBanner status={status} />

      <View style={editStyles.onboardingActions}>
        <AuthPrimaryButton
          label="Continue"
          onPress={() => {
            void handleSubmit();
          }}
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
          style={editStyles.saveButton}
        />
        <Pressable
          onPress={handleSkip}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
          style={editStyles.skipButton}
        >
          <Text
            style={[
              editStyles.skipLabel,
              isSubmitting && editStyles.skipDisabled,
            ]}
          >
            Skip for now
          </Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
}

function createEditStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  _isDark: boolean,
) {
  return StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.background,
    },
    flex: {
      flex: 1,
    },
    headerBar: {
      width: '100%',
      minHeight: 56,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      zIndex: 1,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 16,
      lineHeight: 22,
      color: theme.colors.textPrimary,
      marginHorizontal: -40,
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.textSecondary,
      marginBottom: 24,
    },
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      marginTop: 0,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
    },
    fieldBlock: {
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    fieldDivider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    fieldLabel: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 11,
      lineHeight: 16,
      color: theme.colors.textMuted,
      marginBottom: 2,
    },
    fieldInput: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textPrimary,
      padding: 0,
      margin: 0,
    },
    fieldInputDisabled: {
      color: theme.colors.textSecondary,
    },
    fieldError: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 11,
      lineHeight: 16,
      color: theme.colors.notification,
      paddingHorizontal: 14,
      paddingBottom: 8,
    },
    saveButton: {
      backgroundColor: theme.colors.brand,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
    onboardingActions: {
      marginTop: 8,
    },
    skipButton: {
      alignItems: 'center',
      paddingVertical: 14,
    },
    skipLabel: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    skipDisabled: {
      opacity: 0.45,
    },
  });
}
