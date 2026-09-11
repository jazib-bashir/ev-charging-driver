import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ScreenContainer } from '@/components/ui/screen-container';
import { getStationImageSource } from '@/data/station-images';
import { useStationDetails } from '@/hooks/use-station-details';
import { theme } from '@/theme';
import {
  formatDetailDistance,
  formatDetailPricePerKwh,
} from '@/utils/charger';
import {
  formatText,
  getStationAddress,
  getStationStatus,
  hasValue,
} from '@/utils/station';

import { StationAmenitiesSection } from './station-amenities-section';
import { StationChargersSection } from './station-chargers-section';
import { StationDetailsHeader } from './station-details-header';
import { StationDetailsLoadingState } from './station-details-loading-state';

const TABLET_BREAKPOINT = 768;
const MAX_CONTENT_WIDTH = 720;
const HERO_HEIGHT = 220;

type StationDetailsScreenProps = {
  stationId: string;
};

function StationNotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.centeredState}>
      <Text style={styles.stateTitle}>Station not found</Text>
      <Pressable
        style={styles.stateButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.stateButtonText}>Go Back</Text>
      </Pressable>
    </View>
  );
}

function StationErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centeredState}>
      <Text style={styles.stateTitle}>Unable to load station</Text>
      <Text style={styles.stateMessage}>
        Please check your connection and try again.
      </Text>
      <Pressable
        style={styles.stateButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry loading station"
      >
        <Text style={styles.stateButtonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

function StationDetailsContent({ stationId }: StationDetailsScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  const {
    station,
    chargers,
    isStationLoading,
    isStationError,
    isStationNotFound,
    isChargersLoading,
    isChargersError,
    retryStation,
    retryChargers,
  } = useStationDetails(stationId);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  if (isStationLoading) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <StationDetailsHeader onBack={handleBack} />
        <StationDetailsLoadingState />
      </ScreenContainer>
    );
  }

  if (isStationError) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <StationDetailsHeader onBack={handleBack} />
        <StationErrorState onRetry={retryStation} />
      </ScreenContainer>
    );
  }

  if (isStationNotFound || !station) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <StationDetailsHeader onBack={handleBack} />
        <StationNotFoundState onBack={handleBack} />
      </ScreenContainer>
    );
  }

  const status = getStationStatus(station);
  const address = getStationAddress(station);
  const imageSource = getStationImageSource(station);
  const showDistance = hasValue(station.distanceMi);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <StationDetailsHeader onBack={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
        ]}
      >
        <View style={styles.heroContainer}>
          <Image
            source={imageSource}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
          />

          <View style={styles.verifiedBadge}>
            <Icon name="checkmark" size={14} color={theme.colors.statusDot} />
            <Text style={styles.verifiedText}>GridFlow Verified</Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.titleRow}>
            <Text style={styles.stationName} numberOfLines={2}>
              {formatText(station.name)}
            </Text>

            <View style={styles.distanceBlock}>
              <Text style={styles.distanceValue}>
                {formatDetailDistance(station.distanceMi)}
              </Text>
              {showDistance ? (
                <Text style={styles.distanceLabel}>miles</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.addressRow}>
            <Icon name="location" size={15} color={theme.colors.textMuted} />
            <Text style={styles.addressText} numberOfLines={2}>
              {formatText(address)}
            </Text>
          </View>

          <View style={styles.infoTileRow}>
            <View style={styles.infoTile}>
              <Text style={styles.infoTileLabel}>Status</Text>
              <View style={styles.infoTileValueRow}>
                <View
                  style={[
                    styles.statusDot,
                    status.variant === 'available' && styles.statusDotAvailable,
                  ]}
                />
                <Text
                  style={[
                    styles.infoTileValue,
                    status.variant === 'available' && styles.infoTileValueAvailable,
                  ]}
                >
                  {status.label}
                </Text>
              </View>
            </View>

            <View style={styles.infoTile}>
              <Text style={styles.infoTileLabel}>Pricing</Text>
              <Text style={styles.infoTileValue}>
                {formatDetailPricePerKwh(station.defaultPricePerKwh)}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.navigateButton}
            accessibilityRole="button"
            accessibilityLabel={`Navigate to ${station.name}`}
          >
            <Icon name="car" size={18} color={theme.colors.textInverse} />
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </Pressable>
        </View>

        <StationAmenitiesSection />

        <StationChargersSection
          chargers={chargers}
          isLoading={isChargersLoading}
          isError={isChargersError}
          onRetry={retryChargers}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

export function StationDetailsScreen({ stationId }: StationDetailsScreenProps) {
  return <StationDetailsContent stationId={stationId} />;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  scrollContentTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  heroContainer: {
    position: 'relative',
    height: HERO_HEIGHT,
    backgroundColor: theme.colors.placeholder,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    ...theme.shadows.badge,
  },
  verifiedText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  summarySection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  stationName: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  distanceBlock: {
    alignItems: 'flex-end',
    gap: 1,
  },
  distanceValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.brand,
    letterSpacing: -0.2,
  },
  distanceLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: -4,
  },
  addressText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  infoTileRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  infoTile: {
    flex: 1,
    backgroundColor: '#f3f5f9',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: 6,
  },
  infoTileLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.fontWeight.medium,
  },
  infoTileValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoTileValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  infoTileValueAvailable: {
    color: theme.colors.brand,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.statusUnavailable,
  },
  statusDotAvailable: {
    backgroundColor: theme.colors.brand,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    marginTop: theme.spacing.xs,
  },
  navigateButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textInverse,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  stateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  stateMessage: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  stateButton: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
  },
  stateButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textInverse,
  },
});
