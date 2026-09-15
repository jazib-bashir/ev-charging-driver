import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  driverVehicleTitle,
  formatVehicleRecordId,
  getVehicleProfileSubtitle,
} from '@/auth/profile-flow';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { theme } from '@/theme';
import type { DriverVehicle } from '@/types/vehicle';
import { getDriverVehicleConnectors } from '@/api/driverVehicles';

const ICON_BACKGROUNDS = ['#ecfdf5', '#eef2ff', '#f0fdfa', '#f5f3ff'] as const;
const ICON_COLORS = [theme.colors.brand, '#6366f1', theme.colors.brandDark, '#7c3aed'] as const;
const CHIP_BG = '#eef2ff';
const META_BG = '#eef2ff';

type ProfileVehicleCardProps = {
  vehicle: DriverVehicle;
  index: number;
  isBusy?: boolean;
  disabled?: boolean;
  onMakeDefault: () => void;
  onManageVehicles: () => void;
};

function ProfileConnectorChip({ label }: { label: string }) {
  return (
    <View style={styles.connectorChip}>
      <Text style={styles.connectorChipText}>{label}</Text>
    </View>
  );
}

export function ProfileVehicleCard({
  vehicle,
  index,
  isBusy = false,
  disabled = false,
  onMakeDefault,
  onManageVehicles,
}: ProfileVehicleCardProps) {
  const connectors = getDriverVehicleConnectors(vehicle);
  const title = driverVehicleTitle(vehicle);
  const subtitle = getVehicleProfileSubtitle(vehicle, title);
  const iconBackground = ICON_BACKGROUNDS[index % ICON_BACKGROUNDS.length];
  const iconColor = ICON_COLORS[index % ICON_COLORS.length];

  const handleMenuPress = () => {
    const options: {
      text: string;
      onPress?: () => void;
      style?: 'cancel' | 'default' | 'destructive';
    }[] = [];

    if (!vehicle.isDefault) {
      options.push({ text: 'Make default', onPress: onMakeDefault });
    }

    options.push({ text: 'Manage vehicles', onPress: onManageVehicles });
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(title, undefined, options);
  };

  return (
    <View style={[styles.card, vehicle.isDefault && styles.cardDefault]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
          <Icon name="car" size={20} color={iconColor} />
        </View>

        <View style={styles.headerBody}>
          <View style={styles.titleLine}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {vehicle.isDefault ? (
              <View style={styles.defaultBadge}>
                <Icon name="star" size={9} color={theme.colors.textInverse} />
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            ) : null}
          </View>

          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <IconButton
          accessibilityLabel={`Vehicle options for ${title}`}
          onPress={handleMenuPress}
          disabled={disabled || isBusy}
          style={styles.menuButton}
        >
          <Icon name="more" size={17} color={theme.colors.textMuted} />
        </IconButton>
      </View>

      <View style={styles.metadataBar}>
        <Text style={styles.metadataText} numberOfLines={1}>
          ID: {formatVehicleRecordId(vehicle.id)}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.connectorSection}>
          {connectors.length > 0 ? (
            <>
              <Text style={styles.connectorLabel}>Connectors:</Text>
              <View style={styles.connectorRow}>
                {connectors.map((connector) => (
                  <ProfileConnectorChip key={connector} label={connector} />
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.connectorEmpty}>No connectors listed</Text>
          )}
        </View>

        {vehicle.isDefault ? (
          <View style={styles.activeRow}>
            <Icon name="checkmark" size={14} color={theme.colors.brand} />
            <Text style={styles.activeLabel}>Active</Text>
          </View>
        ) : (
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
              <ActivityIndicator size="small" color={theme.colors.brand} />
            ) : (
              <>
                <Icon name="star" size={11} color={theme.colors.textSecondary} />
                <Text style={styles.makeDefaultLabel}>Make Default</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cardDefault: {
    borderColor: '#5eead4',
    backgroundColor: '#fefffe',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
    paddingTop: 1,
    gap: 2,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingRight: theme.spacing.xs,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.25,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brand,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textInverse,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  menuButton: {
    width: 28,
    height: 28,
    marginTop: -2,
    marginRight: -8,
  },
  metadataBar: {
    borderRadius: 10,
    backgroundColor: META_BG,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 9,
  },
  metadataText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: theme.typography.fontWeight.medium,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8ecf0',
  },
  connectorSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  connectorLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  connectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  connectorChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: CHIP_BG,
  },
  connectorChipText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#475569',
    letterSpacing: 0.1,
  },
  connectorEmpty: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  activeLabel: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brand,
  },
  makeDefaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: theme.colors.surface,
  },
  makeDefaultDisabled: {
    opacity: 0.55,
  },
  makeDefaultLabel: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
});
