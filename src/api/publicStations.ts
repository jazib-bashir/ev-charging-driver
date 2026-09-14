import { env } from '@/config/env';
import type { Station, StationsResponse } from '@/types/station';

export type FetchPublicStationsParams = {
  limit?: number;
  offset?: number;
  all?: boolean;
  search?: string;
  city?: string;
  isPrimarySite?: boolean;
  vehicleId?: string;
  connectorType?: string;
  isFastCharger?: boolean;
  sortBy?: 'power' | 'price';
  sortOrder?: 'asc' | 'desc';
  lat?: number;
  lng?: number;
  radius?: number;
};

export class PublicStationsApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicStationsApiError';
  }
}

export function mapApiStation(raw: Record<string, unknown>): Station {
  return {
    id: String(raw.id ?? ''),
    organizationId: raw.organizationId as string | undefined,
    name: String(raw.name ?? ''),
    isPrimarySite: raw.isPrimarySite as boolean | undefined,
    setupStatus: raw.setupStatus as string | undefined,
    chargerCount: raw.chargerCount as number | undefined,
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
    primaryContactName: raw.primaryContactName as string | null | undefined,
    primaryContactEmail: raw.primaryContactEmail as string | null | undefined,
    fullAddress: raw.fullAddress as string | null | undefined,
    placeId: raw.placeId as string | null | undefined,
    formattedAddress: raw.formattedAddress as string | null | undefined,
    latitude: raw.latitude as number | null | undefined,
    longitude: raw.longitude as number | null | undefined,
    geohash: raw.geohash as string | null | undefined,
    city: raw.city as string | null | undefined,
    state: raw.state as string | null | undefined,
    country: raw.country as string | null | undefined,
    postalCode: raw.postalCode as string | null | undefined,
    regionCity: raw.regionCity as string | null | undefined,
    defaultPricePerKwh: raw.defaultPricePerKwh as number | null | undefined,
    completedAt: raw.completedAt as string | null | undefined,
    imageUrl: raw.imageUrl as string | null | undefined,
    distanceMi: raw.distanceMi as number | null | undefined,
    maxPowerKw: raw.maxPowerKw as number | null | undefined,
    availableChargers: raw.availableChargers as number | null | undefined,
    connectors: raw.connectors as Station['connectors'],
    statusLabel: raw.statusLabel as string | null | undefined,
    statusEstimate: raw.statusEstimate as string | null | undefined,
  };
}

export async function fetchPublicStations(
  params: FetchPublicStationsParams = {},
): Promise<StationsResponse> {
  const {
    limit = 20,
    offset = 0,
    all = false,
    search,
    city,
    isPrimarySite,
    vehicleId,
    connectorType,
    isFastCharger,
    sortBy,
    sortOrder,
    lat,
    lng,
    radius,
  } = params;

  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    all: String(all),
  });

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    query.set('search', trimmedSearch);
  }

  const trimmedCity = city?.trim();
  if (trimmedCity) {
    query.set('city', trimmedCity);
  }

  if (typeof isPrimarySite === 'boolean') {
    query.set('isPrimarySite', String(isPrimarySite));
  }

  const trimmedVehicleId = vehicleId?.trim();
  if (trimmedVehicleId) {
    query.set('vehicleId', trimmedVehicleId);
  }

  const trimmedConnectorType = connectorType?.trim();
  if (trimmedConnectorType) {
    query.set('connectorType', trimmedConnectorType);
  }

  if (typeof isFastCharger === 'boolean') {
    query.set('isFastCharger', String(isFastCharger));
  }

  if (sortBy === 'power' || sortBy === 'price') {
    query.set('sortBy', sortBy);
  }

  if (sortOrder === 'asc' || sortOrder === 'desc') {
    query.set('sortOrder', sortOrder);
  }

  const hasGeoTriplet =
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    typeof radius === 'number' &&
    Number.isFinite(radius) &&
    radius > 0;

  if (hasGeoTriplet) {
    query.set('lat', String(lat));
    query.set('lng', String(lng));
    query.set('radius', String(radius));
  }

  const url = `${env.apiBaseUrl}/api/public/stations?${query.toString()}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new PublicStationsApiError('Network request failed');
  }

  if (!response.ok) {
    throw new PublicStationsApiError(`Request failed with status ${response.status}`);
  }

  let json: Record<string, unknown>;
  try {
    json = await response.json();
  } catch {
    throw new PublicStationsApiError('Invalid response from server');
  }

  const rawData = Array.isArray(json.data) ? json.data : [];
  const rawPagination = json.pagination as Record<string, unknown> | undefined;

  return {
    data: rawData.map((item) => mapApiStation(item as Record<string, unknown>)),
    pagination: {
      limit: Number(rawPagination?.limit ?? limit),
      offset: Number(rawPagination?.offset ?? offset),
      total: Number(rawPagination?.total ?? rawData.length),
      hasMore: Boolean(rawPagination?.hasMore),
    },
  };
}

export async function fetchPublicStation(id: string): Promise<Station | null> {
  const url = `${env.apiBaseUrl}/api/public/stations/${encodeURIComponent(id)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new PublicStationsApiError('Network request failed');
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new PublicStationsApiError(`Request failed with status ${response.status}`);
  }

  let json: Record<string, unknown>;
  try {
    json = await response.json();
  } catch {
    throw new PublicStationsApiError('Invalid response from server');
  }

  if (!json.id) {
    return null;
  }

  return mapApiStation(json);
}
