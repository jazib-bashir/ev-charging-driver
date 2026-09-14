import { router, type Href } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';

import {
  AuthApiError,
  requestOtp,
  resolveHasDefaultVehicle,
  resolveIsOnboarded,
  verifyOtp,
} from '@/api/auth';
import {
  formatPkLocalDisplay,
  getDevAutoFillOtp,
  isValidPkMobile,
  maskE164ForDisplay,
  normalizePkLocalNumber,
  PAKISTAN_DIAL_CODE,
  toE164Pk,
} from '@/auth/auth-helpers';
import { useAuth } from '@/auth/auth-context';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { theme } from '@/theme';

type AuthStep = 'phone' | 'otp';

const OTP_LENGTH = 6;

export function OtpAuthScreen() {
  const { setSession, pendingBooking } = useAuth();
  const otpInputRef = useRef<TextInputType>(null);
  const { status, showError, showSuccess, clearStatus } = useRequestStatus(3000);

  const [step, setStep] = useState<AuthStep>('phone');
  const [localPhone, setLocalPhone] = useState('');
  const [e164Phone, setE164Phone] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [devAutoFilled, setDevAutoFilled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = step === 'phone' ? 'Phone number' : 'Enter OTP';
  const subtitle = useMemo(() => {
    if (step === 'phone') {
      return 'Enter your mobile number to continue.';
    }

    return e164Phone
      ? `Enter the verification code sent to ${maskE164ForDisplay(e164Phone)}.`
      : 'Enter the verification code from your phone.';
  }, [step, e164Phone]);

  const handlePhoneChange = (value: string) => {
    if (isSubmitting) {
      return;
    }
    setLocalPhone(normalizePkLocalNumber(value));
    clearStatus();
  };

  const handleOtpChange = (value: string) => {
    if (isSubmitting) {
      return;
    }
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtpCode(digits);
    clearStatus();
  };

  const goBackToPhone = () => {
    if (isSubmitting) {
      return;
    }
    setStep('phone');
    setChallengeId(null);
    setOtpCode('');
    setDevAutoFilled(false);
    clearStatus();
  };

  const handlePhoneContinue = async () => {
    if (isSubmitting) {
      return;
    }

    if (!isValidPkMobile(localPhone)) {
      showError('Enter a valid mobile number (3XX XXXXXXX)');
      return;
    }

    const identifier = toE164Pk(localPhone);
    clearStatus();
    setIsSubmitting(true);

    try {
      const response = await requestOtp(identifier);
      const autoFill = getDevAutoFillOtp(response.code);

      setE164Phone(identifier);
      setChallengeId(response.challenge_id);
      setOtpCode(autoFill.slice(0, OTP_LENGTH));
      setDevAutoFilled(Boolean(autoFill));
      setStep('otp');
      showSuccess('Verification code sent. Enter it below to continue.');
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : 'Unable to send verification code. Please try again.';
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpContinue = async () => {
    if (isSubmitting) {
      return;
    }

    if (!challengeId) {
      showError('Missing verification challenge. Go back and try again.');
      return;
    }

    if (otpCode.trim().length < 4) {
      showError('Enter the verification code');
      return;
    }

    clearStatus();
    setIsSubmitting(true);

    try {
      const tokenResponse = await verifyOtp(challengeId, otpCode);
      const user = await setSession(tokenResponse.token);

      if (!resolveIsOnboarded(user)) {
        router.replace('/auth/onboarding' as Href);
        return;
      }

      if (!resolveHasDefaultVehicle(user)) {
        router.replace({
          pathname: '/auth/vehicles',
          params: pendingBooking?.stationId ? { from: 'booking' } : undefined,
        } as Href);
        return;
      }

      if (pendingBooking?.stationId) {
        router.replace({
          pathname: '/stations/[id]',
          params: {
            id: pendingBooking.stationId,
            resumeChargerId: pendingBooking.chargerId,
            resumeBooking: '1',
          },
        } as Href);
        return;
      }

      router.replace('/' as Href);
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : 'Unable to verify code. Please try again.';
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title={title}
      subtitle={subtitle}
      showBack
      onBack={step === 'otp' ? goBackToPhone : undefined}
    >
      {step === 'phone' ? (
        <View style={styles.stepBody}>
          <Text style={styles.fieldLabel}>Phone number</Text>
          <View
            style={[
              styles.phoneRow,
              status?.tone === 'error' ? styles.phoneRowError : null,
            ]}
          >
            <View style={styles.prefixChip}>
              <Text style={styles.flag}>🇵🇰</Text>
              <Text style={styles.dialCode}>{PAKISTAN_DIAL_CODE}</Text>
            </View>
            <View style={styles.divider} />
            <TextInput
              style={styles.phoneInput}
              value={formatPkLocalDisplay(localPhone)}
              onChangeText={handlePhoneChange}
              placeholder="3XX XXXXXXX"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={11}
              editable={!isSubmitting}
              accessibilityLabel="Pakistan mobile number"
            />
          </View>
          <RequestStatusBanner status={status} />
          <AuthPrimaryButton
            label="Continue"
            onPress={() => {
              void handlePhoneContinue();
            }}
            loading={isSubmitting}
            disabled={!isValidPkMobile(localPhone) || isSubmitting}
          />
        </View>
      ) : (
        <View style={styles.stepBody}>
          <Pressable
            onPress={goBackToPhone}
            disabled={isSubmitting}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Change phone number"
          >
            <Text
              style={[
                styles.changeNumber,
                isSubmitting && styles.changeNumberDisabled,
              ]}
            >
              Change phone number
            </Text>
          </Pressable>

          <Text style={styles.fieldLabel}>OTP code</Text>
          <Pressable
            style={styles.otpBoxes}
            onPress={() => {
              if (!isSubmitting) {
                otpInputRef.current?.focus();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="OTP input"
          >
            {Array.from({ length: OTP_LENGTH }).map((_, index) => {
              const digit = otpCode[index];
              return (
                <View
                  key={`otp-${index}`}
                  style={[
                    styles.otpBox,
                    digit ? styles.otpBoxFilled : null,
                    status?.tone === 'error' ? styles.otpBoxError : null,
                  ]}
                >
                  <Text style={styles.otpDigit}>{digit ? '*' : ''}</Text>
                </View>
              );
            })}
          </Pressable>

          <TextInput
            ref={otpInputRef}
            style={styles.hiddenOtpInput}
            value={otpCode}
            onChangeText={handleOtpChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            secureTextEntry
            caretHidden
            autoFocus
            editable={!isSubmitting}
          />

          <RequestStatusBanner status={status} />
          {devAutoFilled ? (
            <Text style={styles.devHint}>
              Dev auto-fill enabled from API response. Replace with SMS OTP later.
            </Text>
          ) : null}

          <AuthPrimaryButton
            label="Continue"
            onPress={() => {
              void handleOtpContinue();
            }}
            loading={isSubmitting}
            disabled={otpCode.trim().length < 4 || !challengeId || isSubmitting}
          />
        </View>
      )}
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  stepBody: {
    gap: theme.spacing.md,
  },
  fieldLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  phoneRowError: {
    borderColor: theme.colors.notification,
  },
  prefixChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    height: '100%',
    backgroundColor: theme.colors.brandMuted,
  },
  flag: {
    fontSize: 18,
  },
  dialCode: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.border,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
  },
  changeNumber: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brand,
    marginBottom: theme.spacing.xs,
  },
  changeNumberDisabled: {
    opacity: 0.45,
  },
  otpBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brandMuted,
  },
  otpBoxError: {
    borderColor: theme.colors.notification,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  devHint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
});
