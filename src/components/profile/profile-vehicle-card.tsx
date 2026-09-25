import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  driverVehicleTitle,
  formatVehicleRecordId,
  getVehicleProfileSubtitle,
} from '@/auth/profile-flow';
import { getDriverVehicleConnectors } from '@/api/driverVehicles';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { useTheme } from '@/theme';
import type { DriverVehicle } from '@/types/vehicle';

type ProfileVehicleCardProps = {
  vehicle: DriverVehicle;
  index: number;
  isBusy?: boolean;
  disabled?: boolean;
  onMakeDefault: () => void;
  onManageVehicles: () => void;
  onEditPlate: () => void;
};

type ActionItem = {
  key: string;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'cancel';
};

function ProfileConnectorChip({
  label,
  styles,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.connectorChip}>
      <Text style={styles.connectorChipText}>{label}</Text>
    </View>
  );
}

export function ProfileVehicleCard({
  vehicle,
  isBusy = false,
  disabled = false,
  onMakeDefault,
  onManageVehicles,
  onEditPlate,
}: ProfileVehicleCardProps) {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const connectors = getDriverVehicleConnectors(vehicle);
  const title = driverVehicleTitle(vehicle);
  const subtitle = getVehicleProfileSubtitle(vehicle, title);
  const isDefault = vehicle.isDefault;

  const plateActionLabel = vehicle.licensePlate
    ? 'Edit Number Plate'
    : 'Add Number Plate';

  const actions: ActionItem[] = [
    ...(!isDefault
      ? [
          {
            key: 'default',
            label: 'Make Default',
            onPress: () => {
              setMenuOpen(false);
              onMakeDefault();
            },
          } satisfies ActionItem,
        ]
      : []),
    {
      key: 'plate',
      label: plateActionLabel,
      onPress: () => {
        setMenuOpen(false);
        onEditPlate();
      },
    },
    {
      key: 'manage',
      label: 'Manage Vehicles',
      onPress: () => {
        setMenuOpen(false);
        onManageVehicles();
      },
    },
  ];

  const plateLabel = vehicle.licensePlate
    ? `Plate: ${vehicle.licensePlate}`
    : 'No plate';
  const metaLine = `ID: ${formatVehicleRecordId(vehicle.id)} · ${plateLabel}`;

  return (
    <>
      <View style={[styles.card, isDefault && styles.cardDefault]}>
        <View style={styles.topRow}>
          <View
            style={[
              styles.iconWrap,
              isDefault ? styles.iconWrapDefault : styles.iconWrapIdle,
            ]}
          >
            <Icon
              name="car"
              size={20}
              color={isDefault ? theme.colors.accent : theme.colors.textMuted}
            />
          </View>

          <View style={styles.body}>
            <View style={styles.titleLine}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {isDefault ? (
                <View style={styles.defaultBadge}>
                  <Icon name="star" size={9} color={theme.colors.accent} />
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              ) : null}
            </View>

            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}

            <Text style={styles.meta} numberOfLines={1}>
              {metaLine}
            </Text>
          </View>

          <IconButton
            accessibilityLabel={`Vehicle options for ${title}`}
            onPress={() => setMenuOpen(true)}
            disabled={disabled || isBusy}
            style={[
              styles.menuButton,
              // Prevent harsh blue focus ring in web / Expo web preview.
              { outlineStyle: 'none', outlineWidth: 0 } as object,
            ]}
          >
            <Icon name="more" size={16} color={theme.colors.textMuted} />
          </IconButton>
        </View>

        <View style={styles.footer}>
          <View style={styles.connectorRow}>
            {connectors.length > 0 ? (
              connectors.map((connector) => (
                <ProfileConnectorChip
                  key={connector}
                  label={connector}
                  styles={styles}
                />
              ))
            ) : (
              <Text style={styles.connectorEmpty}>No connectors listed</Text>
            )}
          </View>

          {!isDefault ? (
            <Pressable
              onPress={onMakeDefault}
              disabled={disabled || isBusy}
              style={[
                styles.makeDefaultButton,
                (disabled || isBusy) && styles.makeDefaultDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Make ${title} default`}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color={theme.colors.accent} />
              ) : (
                <>
                  <Icon name="star" size={11} color={theme.colors.accent} />
                  <Text style={styles.makeDefaultLabel}>Make Default</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>

      <Modal
        transparent
        visible={menuOpen}
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setMenuOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss vehicle actions"
          />
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle} numberOfLines={1}>
              {title}
            </Text>

            {actions.map((action, index) => (
              <Pressable
                key={action.key}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.modalAction,
                  index < actions.length - 1 && styles.modalActionDivider,
                  pressed && styles.modalActionPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <Text style={styles.modalActionLabel}>{action.label}</Text>
              </Pressable>
            ))}

            <Pressable
              onPress={() => setMenuOpen(false)}
              style={({ pressed }) => [
                styles.modalCancel,
                pressed && styles.modalActionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.modalCancelLabel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  isDark: boolean,
) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
      padding: 12,
      gap: 12,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
    },
    cardDefault: {
      borderColor: theme.colors.selectionBorder,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      flexShrink: 0,
    },
    iconWrapIdle: {
      backgroundColor: theme.colors.iconBackground,
      borderColor: theme.colors.border,
    },
    iconWrapDefault: {
      backgroundColor: theme.colors.brandMuted,
      borderColor: theme.colors.selectionBorder,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: 4,
      paddingTop: 1,
    },
    titleLine: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    title: {
      flexShrink: 1,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.textPrimary,
    },
    defaultBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 20,
      backgroundColor: theme.colors.brandMuted,
    },
    defaultBadgeText: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 10,
      lineHeight: 15,
      color: theme.colors.accent,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.textMuted,
    },
    meta: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 11,
      lineHeight: 16.5,
      color: theme.colors.textMuted,
    },
    menuButton: {
      width: 28,
      height: 28,
      marginTop: -2,
      marginRight: -4,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingLeft: 52,
    },
    connectorRow: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      minWidth: 0,
    },
    connectorChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: theme.colors.iconBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    connectorChipText: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 11,
      lineHeight: 16,
      color: theme.colors.textSecondary,
    },
    connectorEmpty: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    makeDefaultButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
    },
    makeDefaultDisabled: {
      opacity: 0.55,
    },
    makeDefaultLabel: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.accent,
    },
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.colors.overlay,
    },
    modalSheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 16,
      paddingTop: 12,
      zIndex: 2,
    },
    modalHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      marginBottom: 0,
    },
    modalTitle: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.textPrimary,
      marginTop: 8,
      marginBottom: 8,
    },
    modalAction: {
      paddingVertical: 16,
    },
    modalActionDivider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    modalActionPressed: {
      opacity: 0.7,
    },
    modalActionLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textPrimary,
      textAlign: 'left',
    },
    modalCancel: {
      marginTop: 8,
      paddingVertical: 16,
      borderRadius: 12,
      backgroundColor: isDark ? theme.colors.iconBackground : '#F1F5F9',
      alignItems: 'center',
    },
    modalCancelLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textPrimary,
    },
  });
}
