import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import {
  driverVehicleTitle,
  formatVehicleRecordId,
  getVehicleProfileSubtitle,
} from '@/auth/profile-flow';
import { getDriverVehicleConnectors } from '@/api/driverVehicles';
import { ButtonLoader } from '@/components/loaders/button-loader';
import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { FullScreenImageModal } from '@/components/vehicle/full-screen-image-modal';
import { VehicleThumbnail } from '@/components/vehicle/vehicle-thumbnail';
import { useTheme } from '@/theme';
import type { DriverVehicle } from '@/types/vehicle';
import { getDriverVehicleImageUrl } from '@/utils/vehicle-image';

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
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const connectors = getDriverVehicleConnectors(vehicle);
  const title = driverVehicleTitle(vehicle);
  const subtitle = getVehicleProfileSubtitle(vehicle, title);
  const isDefault = vehicle.isDefault;
  const imageUrl = getDriverVehicleImageUrl(vehicle);

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
          <VehicleThumbnail
            uri={imageUrl}
            accessibilityLabel={`${title} image`}
            width={88}
            height={88}
            iconSize={32}
            onPress={
              imageUrl
                ? () => {
                    setLightboxOpen(true);
                  }
                : undefined
            }
          />

          <View style={styles.body}>
            <View style={styles.headerRow}>
              <View style={styles.titleLine}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {isDefault ? (
                  <Badge
                    label="Default"
                    variant="available"
                    style={styles.defaultBadge}
                  />
                ) : null}
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

            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}

            <Text style={styles.meta} numberOfLines={1}>
              {metaLine}
            </Text>

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
                  <Text style={styles.connectorEmpty}>
                    No connectors listed
                  </Text>
                )}
              </View>

              {!isDefault ? (
                <Pressable
                  onPress={onMakeDefault}
                  disabled={disabled || isBusy}
                  hitSlop={6}
                  style={[
                    styles.makeDefaultButton,
                    (disabled || isBusy) && styles.makeDefaultDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Make ${title} default`}
                >
                  {isBusy ? (
                    <ButtonLoader size={22} color={theme.colors.textLink} />
                  ) : (
                    <>
                      <Icon
                        name="star"
                        size={12}
                        color={theme.colors.textLink}
                      />
                      <Text style={styles.makeDefaultLabel}>Make Default</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <BottomSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={title}
        maxHeightRatio={0.6}
      >
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
            <Icon name="chevron-forward" size={16} color={theme.colors.textMuted} />
          </Pressable>
        ))}
        <View style={styles.cancelWrap}>
          <Button
            label="Cancel"
            variant="secondary"
            onPress={() => setMenuOpen(false)}
            accessibilityLabel="Cancel"
          />
        </View>
      </BottomSheet>

      <FullScreenImageModal
        visible={lightboxOpen}
        uri={imageUrl}
        accessibilityLabel={`${title} image`}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
      padding: 12,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
    },
    cardDefault: {
      borderColor: theme.colors.primary,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },
    titleLine: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    title: {
      flexShrink: 1,
      fontFamily: theme.typography.fontFamily.brandSemiBold,
      fontSize: 16,
      lineHeight: 22,
      letterSpacing: -0.2,
      color: theme.colors.textPrimary,
    },
    defaultBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
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
      lineHeight: 15,
      color: theme.colors.textMuted,
    },
    menuButton: {
      width: 28,
      height: 28,
      marginRight: -4,
      flexShrink: 0,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 6,
    },
    connectorRow: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      minWidth: 0,
    },
    connectorChip: {
      paddingHorizontal: 7,
      paddingVertical: 1,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceSunken,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
    },
    connectorChipText: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 11,
      lineHeight: 14,
      includeFontPadding: false,
      textAlignVertical: 'center',
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
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.textLink,
    },
    modalAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
    },
    cancelWrap: {
      marginTop: theme.spacing.md,
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
  });
}
