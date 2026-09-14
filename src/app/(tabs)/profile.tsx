import { router, type Href, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getDriverVehicleDisplayName } from '@/api/driverVehicles';
import { useAuth } from '@/auth/auth-context';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';
import { theme } from '@/theme';

export default function ProfileScreen() {
  const {
    user,
    isAuthenticated,
    isOnboarded,
    logout,
    isLoading,
    refreshUser,
  } = useAuth();
  const { status, showError, showSuccess, clearStatus } = useRequestStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        return;
      }

      let cancelled = false;

      (async () => {
        setIsRefreshing(true);
        clearStatus();
        try {
          const nextUser = await refreshUser();
          if (!cancelled && !nextUser) {
            showError('Unable to refresh your profile. Please sign in again.');
          }
        } catch {
          if (!cancelled) {
            showError('Unable to refresh your profile. Please try again.');
          }
        } finally {
          if (!cancelled) {
            setIsRefreshing(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [isAuthenticated, refreshUser, clearStatus, showError]),
  );

  const handleEditDetails = useCallback(() => {
    if (isLoggingOut || isRefreshing) {
      return;
    }

    if (!isOnboarded) {
      router.push('/auth/onboarding' as Href);
      return;
    }

    router.push({
      pathname: '/auth/onboarding',
      params: { mode: 'edit' },
    } as Href);
  }, [isOnboarded, isLoggingOut, isRefreshing]);

  const handleManageVehicles = useCallback(() => {
    if (isLoggingOut || isRefreshing) {
      return;
    }

    router.push({
      pathname: '/auth/vehicles',
      params: { from: 'profile' },
    } as Href);
  }, [isLoggingOut, isRefreshing]);

  const handleLogin = useCallback(() => {
    router.push('/auth' as Href);
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    clearStatus();

    try {
      await logout();
      showSuccess('Signed out successfully.');
    } catch {
      showError('Unable to sign out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, clearStatus, showSuccess, showError]);

  if (isLoading) {
    return (
      <ScreenContainer edges={['top']}>
        <ScreenContent style={styles.centered}>
          <ActivityIndicator color={theme.colors.brand} />
          <Text style={styles.muted}>Loading profile…</Text>
        </ScreenContent>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ScreenContainer edges={['top']}>
        <ScreenContent style={styles.content}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>
            Sign in to manage your details and vehicles.
          </Text>
          <RequestStatusBanner status={status} />
          <AuthPrimaryButton label="Sign in" onPress={handleLogin} />
        </ScreenContent>
      </ScreenContainer>
    );
  }

  const defaultVehicleLabel = user.defaultVehicle
    ? getDriverVehicleDisplayName(user.defaultVehicle)
    : null;
  const actionsDisabled = isLoggingOut || isRefreshing;

  return (
    <ScreenContainer edges={['top']}>
      <ScreenContent style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Profile</Text>
          {isRefreshing ? (
            <ActivityIndicator size="small" color={theme.colors.brand} />
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          {isOnboarded
            ? 'Manage your account details and vehicles.'
            : 'Finish your profile to unlock booking.'}
        </Text>

        <View style={styles.card}>
          <ProfileField label="Name" value={user.name || '—'} />
          <ProfileField label="Email" value={user.email || '—'} />
          <ProfileField
            label="Phone"
            value={user.phoneNumber?.trim() || '—'}
          />
          <ProfileField
            label="Default vehicle"
            value={defaultVehicleLabel || 'Not set'}
          />
        </View>

        <RequestStatusBanner status={status} />

        <View style={styles.actions}>
          <AuthPrimaryButton
            label={isOnboarded ? 'Edit details' : 'Complete profile'}
            onPress={handleEditDetails}
            disabled={actionsDisabled}
          />
          <Pressable
            onPress={handleManageVehicles}
            disabled={actionsDisabled}
            style={[
              styles.secondaryButton,
              actionsDisabled && styles.actionDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Manage vehicles"
          >
            <Text style={styles.secondaryLabel}>Manage vehicles</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void handleLogout();
            }}
            disabled={actionsDisabled}
            style={[
              styles.logoutButton,
              actionsDisabled && styles.actionDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            accessibilityState={{ busy: isLoggingOut }}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={theme.colors.notification} />
            ) : (
              <Text style={styles.logoutLabel}>Log out</Text>
            )}
          </Pressable>
        </View>
      </ScreenContent>
    </ScreenContainer>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
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
    marginTop: -theme.spacing.sm,
  },
  muted: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  field: {
    gap: 2,
  },
  fieldLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.fontWeight.medium,
  },
  fieldValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    height: 52,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  secondaryLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  logoutButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  logoutLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.notification,
  },
  actionDisabled: {
    opacity: 0.55,
  },
});
