import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

export type RequestStatusTone = 'success' | 'error';

export type RequestStatus = {
  tone: RequestStatusTone;
  message: string;
} | null;

type RequestStatusBannerProps = {
  status: RequestStatus;
};

export function RequestStatusBanner({ status }: RequestStatusBannerProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!status) {
    return null;
  }

  const isError = status.tone === 'error';

  return (
    <View
      style={[styles.banner, isError ? styles.bannerError : styles.bannerSuccess]}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <Icon
        name={isError ? 'warning' : 'checkmark'}
        size={16}
        color={isError ? theme.colors.errorText : theme.colors.successText}
      />
      <Text style={[styles.text, isError ? styles.textError : styles.textSuccess]}>
        {status.message}
      </Text>
    </View>
  );
}

/** Manage inline success/error feedback with optional auto-clear for success. */
export function useRequestStatus(successClearMs = 2500) {
  const [status, setStatus] = useState<RequestStatus>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStatus = useCallback(() => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    setStatus(null);
  }, []);

  const showError = useCallback(
    (message: string) => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      setStatus({ tone: 'error', message });
    },
    [],
  );

  const showSuccess = useCallback(
    (message: string, options?: { persist?: boolean }) => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      setStatus({ tone: 'success', message });

      if (!options?.persist) {
        clearTimerRef.current = setTimeout(() => {
          setStatus(null);
          clearTimerRef.current = null;
        }, successClearMs);
      }
    },
    [successClearMs],
  );

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  return {
    status,
    showError,
    showSuccess,
    clearStatus,
  };
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    bannerError: {
      backgroundColor: theme.colors.errorBg,
      borderColor: theme.colors.errorBorder,
    },
    bannerSuccess: {
      backgroundColor: theme.colors.successBg,
      borderColor: theme.colors.selectionBorder,
    },
    text: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: 18,
    },
    textError: {
      color: theme.colors.errorText,
    },
    textSuccess: {
      color: theme.colors.successText,
    },
  });
}
