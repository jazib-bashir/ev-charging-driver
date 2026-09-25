import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { AuthWaveHeader } from '@/components/auth/auth-wave-header';
import { Icon } from '@/components/ui/icon';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { ScreenContainer } from '@/components/ui/screen-container';
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

  const handlePhoneScreenBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/' as Href);
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

  const isPhoneStep = step === 'phone';

  return (
    <ScreenContainer edges={['bottom']} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AuthWaveHeader
            onBack={isPhoneStep ? handlePhoneScreenBack : goBackToPhone}
          />

          {isPhoneStep ? (
            <>
              <Text style={styles.heading}>Let's get you connected ⚡</Text>
              <Text style={styles.subtitle}>
                Enter your mobile number to continue.
              </Text>

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

              <View style={styles.statusGap}>
                <RequestStatusBanner status={status} />
              </View>

              <AuthPrimaryButton
                label="Continue"
                onPress={() => {
                  void handlePhoneContinue();
                }}
                loading={isSubmitting}
                disabled={!isValidPkMobile(localPhone) || isSubmitting}
                style={styles.primaryButton}
              />

              <View style={styles.smsHint}>
                <Icon name="checkmark" size={16} color={theme.colors.accent} />
                <Text style={styles.smsHintText}>
                  We'll send a 6-digit verification code via SMS.
                </Text>
              </View>

              <Text style={styles.legalText}>
                By continuing, you agree to GridFlow's{' '}
                <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
                <Text style={styles.legalLink}>Privacy Policy</Text>.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.heading}>Verify Your Phone</Text>
              <Text style={styles.otpInstruction}>
                We sent a 6-digit code to{'\n'}
                <Text style={styles.otpPhone}>
                  {e164Phone ? maskE164ForDisplay(e164Phone) : 'your phone'}
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

              <View style={styles.statusGap}>
                <RequestStatusBanner status={status} />
              </View>

              <AuthPrimaryButton
                label="Verify & Continue →"
                onPress={() => {
                  void handleOtpContinue();
                }}
                loading={isSubmitting}
                disabled={
                  otpCode.trim().length < 4 || !challengeId || isSubmitting
                }
                style={styles.primaryButton}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    backgroundColor: theme.colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  heading: {
    fontFamily: theme.typography.fontFamily.brand,
    fontSize: 24,
    color: theme.colors.textPrimary,
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  otpInstruction: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    paddingHorizontal: 24,
    marginBottom: 16,
    lineHeight: 20,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 56,
    paddingHorizontal: 12,
    marginHorizontal: 24,
    ...theme.shadows.card,
    shadowColor: theme.colors.shadow,
  },
  phoneRowError: {
    borderColor: theme.colors.notification,
  },
  prefixChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderLight,
    paddingRight: 10,
    marginRight: 10,
  },
  flag: {
    fontSize: 18,
  },
  dialCode: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 14,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
  },
  statusGap: {
    marginHorizontal: 24,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 16,
    opacity: 1,
  },
  smsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginHorizontal: 24,
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
    marginTop: theme.spacing.xl,
  },
  legalLink: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
  otpPhone: {
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
  },
  editLink: {
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.accent,
  },
  editLinkDisabled: {
    opacity: 0.45,
  },
  otpBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    ...theme.shadows.card,
    shadowColor: theme.colors.shadow,
  },
  otpBoxFilled: {
    borderColor: theme.colors.accent,
  },
  otpBoxActive: {
    borderColor: theme.colors.accent,
  },
  otpBoxError: {
    borderColor: theme.colors.notification,
  },
  otpDigit: {
    fontFamily: theme.typography.fontFamily.brand,
    fontSize: 18,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  otpHint: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  resendCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 24,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
  },
  resendPrompt: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  resendWait: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.accent,
  },
  resendAction: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.accent,
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
});
