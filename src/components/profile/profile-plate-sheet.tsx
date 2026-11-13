import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { driverVehicleTitle } from '@/auth/profile-flow';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
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
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
    <BottomSheet
      visible={visible}
      onClose={isSaving ? () => undefined : onClose}
      title={isEdit ? 'Edit number plate' : 'Add number plate'}
      maxHeightRatio={0.7}
    >
      <Text style={styles.subtitle} numberOfLines={1}>
        {title}
      </Text>

      <AuthTextField
        label="Number plate"
        value={plateValue}
        onChangeText={(value) => setPlateValue(value.toUpperCase())}
        placeholder="e.g. ABC-123"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={20}
        autoFocus
        editable={!isSaving}
        helper="Optional. Used to identify your car at the charger."
      />

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label="Cancel"
            variant="secondary"
            onPress={onClose}
            disabled={isSaving}
            accessibilityLabel="Cancel"
          />
        </View>
        <View style={styles.action}>
          <Button
            label="Save"
            loading={isSaving}
            onPress={() => onSave(plateValue.trim().toUpperCase())}
            accessibilityLabel="Save number plate"
          />
        </View>
      </View>
    </BottomSheet>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    subtitle: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: theme.spacing.lg,
    },
    action: {
      flex: 1,
    },
  });
}
