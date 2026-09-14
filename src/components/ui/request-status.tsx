import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

export type RequestStatusTone = 'success' | 'error';

export type RequestStatus = {
  tone: RequestStatusTone;
  message: string;
} | null;

type RequestStatusBannerProps = {
  status: RequestStatus;
};

export function RequestStatusBanner({ status }: RequestStatusBannerProps) {
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

const styles = StyleSheet.create({
  banner: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
  },
  bannerError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  bannerSuccess: {
    backgroundColor: theme.colors.brandMuted,
    borderColor: theme.colors.selectionBorder,
  },
  text: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: 18,
  },
  textError: {
    color: theme.colors.notification,
  },
  textSuccess: {
    color: theme.colors.brandDark,
  },
});
