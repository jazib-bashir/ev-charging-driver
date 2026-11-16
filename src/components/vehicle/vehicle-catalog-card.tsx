import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ButtonLoader } from '@/components/loaders/button-loader';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FullScreenImageModal } from '@/components/vehicle/full-screen-image-modal';
import { VehicleThumbnail } from '@/components/vehicle/vehicle-thumbnail';
import { useTheme } from '@/theme';
import type { VehicleCatalogItem } from '@/types/vehicle';
import { getCatalogItemImageUrl } from '@/utils/vehicle-image';

type VehicleCatalogCardProps = {
  item: VehicleCatalogItem;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function VehicleCatalogCard({
  item,
  onPress,
  disabled = false,
  loading = false,
}: VehicleCatalogCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const imageUrl = getCatalogItemImageUrl(item);
  const hasRange =
    typeof item.rangeKm === 'number' && Number.isFinite(item.rangeKm);
  const plugs = [item.acConnectorType, item.dcConnectorType]
    .filter(Boolean)
    .join(' • ');

  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.card, (disabled || loading) && styles.cardDisabled]}
        accessibilityRole="button"
        accessibilityLabel={`Add ${item.displayName}`}
      >
        <VehicleThumbnail
          uri={imageUrl}
          accessibilityLabel={`${item.displayName} image`}
          onPress={
            imageUrl
              ? () => {
                  setLightboxOpen(true);
                }
              : undefined
          }
        />

        <View style={styles.copy}>
          <Text style={styles.make} numberOfLines={1}>
            {item.make}
          </Text>
          <Text style={styles.model} numberOfLines={1}>
            {item.model}
          </Text>
          {hasRange ? (
            <View style={styles.rangeRow}>
              <Text style={styles.rangeLabel}>Range</Text>
              <Icon name="bolt" size={12} color={theme.colors.statusFast} />
              <Text style={styles.rangeText}>{item.rangeKm} km</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.trailing}>
          {plugs ? (
            <Text style={styles.plugs} numberOfLines={1}>
              {plugs}
            </Text>
          ) : null}
          {loading ? (
            <ButtonLoader size={22} color={theme.colors.textLink} />
          ) : (
            <View style={styles.addIconWrap}>
              <Icon name="add" size={18} color={theme.colors.textLink} />
            </View>
          )}
        </View>
      </Pressable>

      <FullScreenImageModal
        visible={lightboxOpen}
        uri={imageUrl}
        accessibilityLabel={`${item.displayName} image`}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const card = theme.isDark ? theme.shadows.none : theme.shadows.card;

  return StyleSheet.create({
    card: {
      minHeight: 88,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginHorizontal: theme.spacing.gutter,
      marginBottom: 8,
      paddingVertical: 12,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      ...card,
    },
    cardDisabled: { opacity: 0.7 },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    make: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      color: theme.colors.textMuted,
      marginBottom: 2,
    },
    model: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 15,
      lineHeight: 20,
      color: theme.colors.textPrimary,
    },
    rangeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    rangeLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      color: theme.colors.textMuted,
      marginRight: 2,
    },
    rangeText: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
    },
    plugs: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginRight: 12,
      maxWidth: 120,
    },
    addIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryMuted,
    },
  });
}
