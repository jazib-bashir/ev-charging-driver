import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { LoginIllustration } from '@/components/auth/login-illustration';
import { Icon } from '@/components/ui/icon';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { theme } from '@/theme';

type AuthStep = 'phone' | 'otp';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 120;

function formatResendCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function OtpAuthScreen() {
  const { setSession, pendingBooking } = useAuth();
  const otpInputRef = useRef<TextInputType>(null);
  const { status, showError, clearStatus } = useRequestStatus(3000);

  const [step, setStep] = useState<AuthStep>('phone');
  const [localPhone, setLocalPhone] = useState('');
  const [e164Phone, setE164Phone] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const title = step === 'phone' ? 'Phone number' : 'Verify Your Phone';
  const subtitle = useMemo(() => {
    if (step === 'phone') {
      return 'Enter your mobile number to continue.';
    }

    return undefined;
  }, [step]);

  useEffect(() => {
    if (step !== 'otp' || resendIn <= 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setResendIn((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [step, resendIn]);

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
    setResendIn(0);
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
      setResendIn(RESEND_COOLDOWN_SECONDS);
      setStep('otp');
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

  const handleResendCode = async () => {
    if (isSubmitting || resendIn > 0 || !e164Phone) {
      return;
    }

    clearStatus();
    setIsSubmitting(true);

    try {
      const response = await requestOtp(e164Phone);
      const autoFill = getDevAutoFillOtp(response.code);

      setChallengeId(response.challenge_id);
      setOtpCode(autoFill.slice(0, OTP_LENGTH));
      setResendIn(RESEND_COOLDOWN_SECONDS);
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

  const legalFooter =
    step === 'phone' ? (
      <Text style={styles.legalText}>
        By continuing, you agree to GridFlow's{' '}
        <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
        <Text style={styles.legalLink}>Privacy Policy</Text>.
      </Text>
    ) : (
      <View style={styles.otpFooter}>
        <AuthPrimaryButton
          label="Verify & Continue →"
          onPress={() => {
            void handleOtpContinue();
          }}
          loading={isSubmitting}
          disabled={otpCode.trim().length < 4 || !challengeId || isSubmitting}
        />
      </View>
    );

  return (
    <AuthScreenShell
      title={title}
      subtitle={subtitle}
      showBack
      showBrandBadge
      centered={step === 'otp'}
      hero={
        step === 'phone' ? (
          <LoginIllustration />
        ) : (
          <View style={styles.otpHero} pointerEvents="none">
            <View style={styles.otpHeroBadge}>
              <Icon name="bolt" size={28} color={theme.colors.brand} />
            </View>
          </View>
        )
      }
      onBack={step === 'otp' ? goBackToPhone : undefined}
      footer={legalFooter}
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
              <Icon
                name="chevron-down"
                size={14}
                color={theme.colors.textMuted}
              />
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
          <View style={styles.smsHint}>
            <Icon name="checkmark" size={16} color={theme.colors.brand} />
            <Text style={styles.smsHintText}>
              We'll send a 6-digit verification code via SMS.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.stepBody}>
          <Text style={styles.otpSentLine}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.otpPhone}>
              {e164Phone
                ? maskE164ForDisplay(e164Phone)
                : 'your phone'}
            </Text>{' '}
            <Text
              onPress={() => {
                if (!isSubmitting) {
                  goBackToPhone();
                }
              }}
              style={[
                styles.editLink,
                isSubmitting && styles.editLinkDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Edit phone number"
            >
              Edit
            </Text>
          </Text>

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
              const isActive = otpCode.length === index;
              return (
                <View
                  key={`otp-${index}`}
                  style={[
                    styles.otpBox,
                    digit ? styles.otpBoxFilled : null,
                    isActive ? styles.otpBoxActive : null,
                    status?.tone === 'error' ? styles.otpBoxError : null,
                  ]}
                >
                  <Text style={styles.otpDigit}>{digit ?? ''}</Text>
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
            caretHidden
            autoFocus
            editable={!isSubmitting}
          />

          <Text style={styles.otpHint}>
            Tap any slot or paste code from clipboard
          </Text>

          <View style={styles.resendCard}>
            <Icon name="time" size={16} color={theme.colors.textMuted} />
            <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
            {resendIn > 0 ? (
              <Text style={styles.resendWait}>
                Resend in {formatResendCountdown(resendIn)}
              </Text>
            ) : (
              <Pressable
                onPress={() => {
                  void handleResendCode();
                }}
                disabled={isSubmitting}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Resend verification code"
              >
                <Text
                  style={[
                    styles.resendAction,
                    isSubmitting && styles.editLinkDisabled,
                  ]}
                >
                  Resend
                </Text>
              </Pressable>
            )}
          </View>

          <RequestStatusBanner status={status} />
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
    backgroundColor: theme.colors.surface,
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
  smsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  smsHintText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  legalText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.md,
  },
  legalLink: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
  otpHero: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  otpHeroBadge: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.brandMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpSentLine: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  otpPhone: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  editLink: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brand,
  },
  editLinkDisabled: {
    opacity: 0.45,
  },
  otpBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: theme.colors.brand,
  },
  otpBoxActive: {
    borderColor: theme.colors.brand,
  },
  otpBoxError: {
    borderColor: theme.colors.notification,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  otpHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  resendCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
  },
  resendPrompt: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  resendWait: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brand,
  },
  resendAction: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brand,
  },
  otpFooter: {
    width: '100%',
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
});
