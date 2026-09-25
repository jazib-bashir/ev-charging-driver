import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { driverVehicleTitle } from '@/auth/profile-flow';
import { useTheme } from '@/theme';
import type { DriverVehicle } from '@/types/vehicle';

type ProfilePlateSheetProps = {
  visible: boolean;
  vehicle: DriverVehicle | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (plate: string) => void;
};

export function ProfilePlateSheet({
  visible,
  vehicle,
  isSaving = false,
  onClose,
  onSave,
}: ProfilePlateSheetProps) {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const [plateValue, setPlateValue] = useState('');

  const isEdit = Boolean(vehicle?.licensePlate?.trim());
  const title = vehicle ? driverVehicleTitle(vehicle) : '';

  useEffect(() => {
    if (visible && vehicle) {
      setPlateValue((vehicle.licensePlate ?? '').toUpperCase());
    }
    if (!visible) {
      setPlateValue('');
    }
  }, [visible, vehicle]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.center}
        >
          <View style={styles.card}>
            <Text style={styles.heading}>
              {isEdit ? 'Edit number plate' : 'Add number plate'}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {title}
            </Text>

            <TextInput
              style={styles.input}
              value={plateValue}
              onChangeText={(value) => setPlateValue(value.toUpperCase())}
              placeholder="e.g. ABC-123"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20}
              autoFocus
              editable={!isSaving}
            />
            <Text style={styles.hint}>
              Optional. Used to identify your car at the charger.
            </Text>

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={styles.cancelButton}
              >
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => onSave(plateValue.trim().toUpperCase())}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Save number plate"
                style={styles.saveButton}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <Text style={styles.saveLabel}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  isDark: boolean,
) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    center: {
      width: '100%',
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 20,
      gap: 10,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
    },
    heading: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 18,
      lineHeight: 24,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.textMuted,
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 15,
      color: theme.colors.textPrimary,
      letterSpacing: 0.6,
    },
    hint: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.textMuted,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    cancelButton: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? theme.colors.iconBackground : '#F1F5F9',
    },
    cancelLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    saveButton: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent,
    },
    saveLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 15,
      color: '#0F172A',
    },
  });
}
