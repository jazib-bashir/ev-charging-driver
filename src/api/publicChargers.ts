import { env } from '@/config/env';
import type { Charger, ChargersResponse } from '@/types/charger';

export class PublicChargersApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicChargersApiError';
  }
}

export function mapApiCharger(raw: Record<string, unknown>): Charger {
  return {
    id: String(raw.id ?? ''),
    organizationId: raw.organizationId as string | undefined,
    stationId: raw.stationId as string | undefined,
    name: String(raw.name ?? ''),
    serialNumber: raw.serialNumber as string | null | undefined,
    chargerType: raw.chargerType as string | null | undefined,
    override: raw.override as boolean | undefined,
    isFastCharger: raw.isFastCharger as boolean | undefined,
    setupStatus: raw.setupStatus as string | null | undefined,
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
    manufacturer: raw.manufacturer as string | null | undefined,
    model: raw.model as string | null | undefined,
    maxPowerKw: raw.maxPowerKw as number | null | undefined,
    pricePerKwh: raw.pricePerKwh as number | null | undefined,
    completedAt: raw.completedAt as string | null | undefined,
    statusLabel: raw.statusLabel as string | null | undefined,
    statusEstimate: raw.statusEstimate as string | null | undefined,
  };
}

export type FetchPublicChargersParams = {
  stationId: string;
  limit?: number;
  offset?: number;
};

export async function fetchPublicChargers(
  params: FetchPublicChargersParams,
): Promise<ChargersResponse> {
  const { stationId, limit = 50, offset = 0 } = params;

  const query = new URLSearchParams({
    stationId,
    limit: String(limit),
    offset: String(offset),
  });

  const url = `${env.apiBaseUrl}/api/public/chargers?${query.toString()}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new PublicChargersApiError('Network request failed');
  }

  if (!response.ok) {
    throw new PublicChargersApiError(`Request failed with status ${response.status}`);
  }

  let json: Record<string, unknown>;
  try {
    json = await response.json();
  } catch {
    throw new PublicChargersApiError('Invalid response from server');
  }

  const rawData = Array.isArray(json.data) ? json.data : [];
  const rawPagination = json.pagination as Record<string, unknown> | undefined;

  return {
    data: rawData.map((item) => mapApiCharger(item as Record<string, unknown>)),
    pagination: {
      limit: Number(rawPagination?.limit ?? limit),
      offset: Number(rawPagination?.offset ?? offset),
      total: Number(rawPagination?.total ?? rawData.length),
      hasMore: Boolean(rawPagination?.hasMore),
    },
  };
}
