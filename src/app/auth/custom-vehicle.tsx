import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthApiError } from '@/api/auth';
import { createDriverVehicle } from '@/api/driverVehicles';
import { useAuth } from '@/auth/auth-context';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { AuthTextField } from '@/components/auth/auth-text-field';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { theme } from '@/theme';
import { CONNECTOR_TYPES, type ConnectorType } from '@/types/vehicle';

export default function CustomVehicleScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { token, refreshUser } = useAuth();
  const { status, showError, showSuccess, clearStatus } = useRequestStatus(1800);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [acConnector, setAcConnector] = useState<ConnectorType | null>(null);
  const [dcConnector, setDcConnector] = useState<ConnectorType | null>(null);
  const [makeError, setMakeError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [connectorError, setConnectorError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(() => {
    const hasExactlyOneConnector =
      (acConnector !== null && dcConnector === null) ||
      (dcConnector !== null && acConnector === null);

    return (
      make.trim().length >= 1 &&
      model.trim().length >= 1 &&
      hasExactlyOneConnector
    );
  }, [make, model, acConnector, dcConnector]);

  const clearConnectorError = () => {
    if (connectorError) {
      setConnectorError(null);
    }
  };

  const handleSelectAc = (type: ConnectorType) => {
    if (isSubmitting) {
      return;
    }
    setAcConnector((current) => (current === type ? null : type));
    setDcConnector(null);
    clearConnectorError();
    clearStatus();
  };

  const handleSelectDc = (type: ConnectorType) => {
    if (isSubmitting) {
      return;
    }
    setDcConnector((current) => (current === type ? null : type));
    setAcConnector(null);
    clearConnectorError();
    clearStatus();
  };

  const handleSave = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedMake = make.trim();
    const trimmedModel = model.trim();
    let hasError = false;

    if (!trimmedMake) {
      setMakeError('Enter the vehicle make');
      hasError = true;
    } else {
      setMakeError(null);
    }

    if (!trimmedModel) {
      setModelError('Enter the vehicle model');
      hasError = true;
    } else {
      setModelError(null);
    }

    if (
      (acConnector && dcConnector) ||
      (!acConnector && !dcConnector)
    ) {
      setConnectorError('Select either an AC or DC connector');
      hasError = true;
    } else {
      setConnectorError(null);
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
      const created = await createDriverVehicle(token, {
        customMake: trimmedMake,
        customModel: trimmedModel,
        ...(acConnector ? { acConnectorType: acConnector } : {}),
        ...(dcConnector ? { dcConnectorType: dcConnector } : {}),
      });
      await refreshUser();

      const label = [trimmedMake, trimmedModel].join(' ');
      showSuccess(
        created.isDefault
          ? `${label} saved as your default vehicle.`
          : `${label} saved.`,
        { persist: true },
      );

      router.replace({
        pathname: '/auth/vehicles',
        params: from === 'profile' ? { from: 'profile' } : undefined,
      } as Href);
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : 'Unable to save custom vehicle. Please try again.';
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title="Custom vehicle"
      subtitle="Enter your vehicle details. Choose either an AC or DC connector — not both."
      showBack
    >
      <AuthTextField
        label="Make"
        value={make}
        onChangeText={(value) => {
          setMake(value);
          if (makeError) {
            setMakeError(null);
          }
          clearStatus();
        }}
        placeholder="e.g. Tesla"
        autoCapitalize="words"
        editable={!isSubmitting}
        error={makeError}
      />
      <AuthTextField
        label="Model"
        value={model}
        onChangeText={(value) => {
          setModel(value);
          if (modelError) {
            setModelError(null);
          }
          clearStatus();
        }}
        placeholder="e.g. Model 3"
        autoCapitalize="words"
        editable={!isSubmitting}
        error={modelError}
      />

      <View style={[styles.section, isSubmitting && styles.sectionDisabled]}>
        <Text style={styles.sectionLabel}>AC connector</Text>
        <View style={styles.chipRow}>
          {CONNECTOR_TYPES.map((type) => (
            <ConnectorChip
              key={`ac-${type}`}
              label={type}
              selected={acConnector === type}
              disabled={isSubmitting}
              onPress={() => handleSelectAc(type)}
            />
          ))}
        </View>
      </View>

      <View style={[styles.section, isSubmitting && styles.sectionDisabled]}>
        <Text style={styles.sectionLabel}>DC connector</Text>
        <View style={styles.chipRow}>
          {CONNECTOR_TYPES.map((type) => (
            <ConnectorChip
              key={`dc-${type}`}
              label={type}
              selected={dcConnector === type}
              disabled={isSubmitting}
              onPress={() => handleSelectDc(type)}
            />
          ))}
        </View>
      </View>

      {connectorError ? (
        <Text style={styles.fieldError}>{connectorError}</Text>
      ) : null}

      <RequestStatusBanner status={status} />

      <AuthPrimaryButton
        label="Save vehicle"
        onPress={() => {
          void handleSave();
        }}
        loading={isSubmitting}
        disabled={!isValid || isSubmitting}
      />
    </AuthScreenShell>
  );
}

type ConnectorChipProps = {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function ConnectorChip({
  label,
  selected,
  disabled,
  onPress,
}: ConnectorChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm,
  },
  sectionDisabled: {
    opacity: 0.6,
  },
  sectionLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipSelected: {
    borderColor: theme.colors.selectionBorder,
    backgroundColor: theme.colors.selectionBackground,
  },
  chipDisabled: {
    opacity: 0.7,
  },
  chipLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  chipLabelSelected: {
    color: theme.colors.selectionForeground,
  },
  fieldError: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.notification,
  },
});
