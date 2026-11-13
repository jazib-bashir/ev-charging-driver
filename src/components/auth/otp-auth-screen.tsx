import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInput as TextInputType,
} from 'react-native';

import { Text, TextInput } from '@/components/ui/text';
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
import { FullScreenLoader } from '@/components/loaders';
import { useTheme } from '@/theme';

type AuthStep = 'phone' | 'otp';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 120;

function formatResendCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function OtpAuthScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isVerifying, setIsVerifying] = useState(false);
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
    setIsVerifying(true);

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
      setIsVerifying(false);
    }
  };

  const isPhoneStep = step === 'phone';
  const phoneError = status?.tone === 'error';

  return (
    <ScreenContainer edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AuthWaveHeader onBack={isPhoneStep ? handlePhoneScreenBack : goBackToPhone} />

          {isPhoneStep ? (
            <View style={styles.form}>
              <Text style={styles.overline}>LET'S GET CONNECTED</Text>
              <Text style={styles.heading}>Your journey starts here.</Text>
              <Text style={styles.subtitle}>Enter your mobile number to continue.</Text>

              <View style={[styles.phoneRow, phoneError ? styles.phoneRowError : null]}>
                <View style={styles.prefixChip}>
                  <Text style={styles.flag}>🇵🇰</Text>
                  <Text style={styles.dialCode}>{PAKISTAN_DIAL_CODE}</Text>
                  <Icon name="chevron-down" size={14} color={theme.colors.textMuted} />
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={formatPkLocalDisplay(localPhone)}
                  onChangeText={handlePhoneChange}
                  placeholder="3XX XXXXXXX"
                  placeholderTextColor={theme.colors.inputPlaceholder}
                  selectionColor={theme.colors.primary}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  maxLength={11}
                  editable={!isSubmitting}
                  accessibilityLabel="Pakistan mobile number"
                />
              </View>

              {status ? (
                <View style={styles.statusGap}>
                  <RequestStatusBanner status={status} />
                </View>
              ) : null}

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
                <Icon name="checkmark" size={16} color={theme.colors.textLink} />
                <Text style={styles.smsHintText}>
                  We'll send a 6-digit verification code via SMS.
                </Text>
              </View>

              <Text style={styles.legalText}>
                By continuing, you agree to konnectEVS{' '}
                <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
                <Text style={styles.legalLink}>Privacy Policy</Text>.
              </Text>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.overline}>VERIFY YOUR NUMBER</Text>
              <Text style={styles.heading}>Enter the 6-digit code.</Text>
              <Text style={styles.subtitle}>
                Sent to{' '}
                <Text style={styles.otpPhone}>
                  {e164Phone ? maskE164ForDisplay(e164Phone) : 'your phone'}
                </Text>{' '}
                <Text
                  onPress={() => {
                    if (!isSubmitting) {
                      goBackToPhone();
                    }
                  }}
                  style={[styles.editLink, isSubmitting && styles.editLinkDisabled]}
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
                        phoneError ? styles.otpBoxError : null,
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

              {status ? (
                <View style={styles.statusGap}>
                  <RequestStatusBanner status={status} />
                </View>
              ) : (
                <Text style={styles.otpHint}>Tap any slot or paste the code from your clipboard.</Text>
              )}

              <View style={styles.resendCard}>
                <Icon name="time" size={16} color={theme.colors.textMuted} />
                <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
                {resendIn > 0 ? (
                  <Text style={styles.resendWait}>Resend in {formatResendCountdown(resendIn)}</Text>
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
                    <Text style={[styles.resendAction, isSubmitting && styles.editLinkDisabled]}>
                      Resend
                    </Text>
                  </Pressable>
                )}
              </View>

              <AuthPrimaryButton
                label="Verify code"
                onPress={() => {
                  void handleOtpContinue();
                }}
                loading={isSubmitting && !isVerifying}
                disabled={otpCode.trim().length < 4 || !challengeId || isSubmitting}
                style={styles.primaryButton}
              />

              <Text style={styles.legalText}>
                By continuing, you agree to konnectEVS's{' '}
                <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
                <Text style={styles.legalLink}>Privacy Policy</Text>.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {isVerifying ? <FullScreenLoader variant="scrim" message="Verifying your code…" /> : null}
    </ScreenContainer>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: theme.spacing.xxl,
    },
    form: {
      paddingHorizontal: theme.spacing.gutter + 4,
      paddingTop: theme.spacing.xxl,
    },
    overline: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      letterSpacing: 1.4,
      color: theme.colors.textLink,
      marginBottom: theme.spacing.sm,
    },
    heading: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 24,
      lineHeight: 36,
      letterSpacing: -1,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      lineHeight: 22,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.xxl,
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.control,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      height: 60,
      paddingHorizontal: 14,
      ...(theme.isDark ? theme.shadows.none : theme.shadows.card),
    },
    phoneRowError: {
      borderColor: theme.colors.error,
    },
    prefixChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: theme.colors.borderStrong,
      paddingRight: 12,
      marginRight: 12,
    },
    flag: {
      fontSize: 20,
    },
    dialCode: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textPrimary,
    },
    phoneInput: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 17,
      letterSpacing: 0.4,
      color: theme.colors.textPrimary,
      paddingVertical: 0,
    },
    statusGap: {
      marginTop: theme.spacing.md,
    },
    primaryButton: {
      marginTop: theme.spacing.xl,
    },
    smsHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: theme.spacing.lg,
    },
    smsHintText: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    legalText: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: theme.spacing.md,
      marginTop: theme.spacing.xxl,
    },
    legalLink: {
      color: theme.colors.textLink,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    otpPhone: {
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    editLink: {
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textLink,
    },
    editLinkDisabled: {
      opacity: 0.45,
    },
    otpBoxes: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: theme.spacing.lg,
    },
    otpBox: {
      flex: 1,
      maxWidth: theme.sizes.otpBox.width,
      height: theme.sizes.otpBox.height,
      backgroundColor: theme.colors.inputBackground,
      borderRadius: theme.radius.control,
      borderWidth: 1.5,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    otpBoxFilled: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.borderStrong,
    },
    otpBoxActive: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.primary,
    },
    otpBoxError: {
      backgroundColor: theme.colors.errorBg,
      borderColor: theme.colors.error,
    },
    otpDigit: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 24,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      includeFontPadding: false,
    },
    otpHint: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.sm,
    },
    resendCard: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surfaceSunken,
    },
    resendPrompt: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    resendWait: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textLink,
    },
    resendAction: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textLink,
    },
    hiddenOtpInput: {
      position: 'absolute',
      opacity: 0,
      height: 1,
      width: 1,
    },
  });
}
