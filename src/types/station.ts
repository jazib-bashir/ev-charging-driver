import type { StationQueueSummary } from '@/types/queue';

export type StationConnector = {
  type: string;
  label?: string;
};

export type Station = {
  id: string;
  organizationId?: string;
  name: string;
  isPrimarySite?: boolean;
  setupStatus?: string;
  chargerCount?: number;
  createdAt?: string;
  updatedAt?: string;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  fullAddress?: string | null;
  placeId?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geohash?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  regionCity?: string | null;
  defaultPricePerKwh?: number | null;
  completedAt?: string | null;
  imageUrl?: string | null;
  imageAsset?: string | null;
  distanceMi?: number | null;
  maxPowerKw?: number | null;
  availableChargers?: number | null;
  connectors?: StationConnector[] | null;
  statusLabel?: string | null;
  statusEstimate?: string | null;
  /** Active station queue when one exists; null when the station is not accepting joins. */
  queue?: StationQueueSummary | null;
};

export type StationsResponse = {
  data: Station[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};

export type StationSortBy = 'power' | 'price';
export type StationSortOrder = 'asc' | 'desc';

/** UI + request state for GET /api/public/stations filter params (excl. pagination). */
export type PublicStationFilterState = {
  radiusKm?: number | null;
  city?: string | null;
  isPrimarySite?: boolean | null;
  lat?: number | null;
  lng?: number | null;
  connectorTypes?: string[] | null;
  isFastCharger?: boolean | null;
  /** Selected driver vehicle id → API `vehicleId`. */
  vehicleId?: string | null;
  sortBy?: StationSortBy | null;
  sortOrder?: StationSortOrder | null;
};
