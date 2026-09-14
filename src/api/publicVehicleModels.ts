import { env } from '@/config/env';
import {
  CONNECTOR_TYPES,
  type ConnectorType,
  type VehicleCatalogItem,
} from '@/types/vehicle';

export class PublicVehicleModelsApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicVehicleModelsApiError';
  }
}

function isConnectorType(value: unknown): value is ConnectorType {
  return (
    typeof value === 'string' &&
    (CONNECTOR_TYPES as readonly string[]).includes(value)
  );
}

function mapVehicleModel(raw: Record<string, unknown>): VehicleCatalogItem | null {
  const id = typeof raw.id === 'string' ? raw.id : '';
  const make = typeof raw.make === 'string' ? raw.make : '';
  const model = typeof raw.model === 'string' ? raw.model : '';
  const displayName =
    typeof raw.displayName === 'string' && raw.displayName.trim()
      ? raw.displayName
      : [make, model].filter(Boolean).join(' ');

  if (!id || !make || !model) {
    return null;
  }

  const acConnectorType = isConnectorType(raw.acConnectorType)
    ? raw.acConnectorType
    : 'Type2';
  const dcConnectorType = isConnectorType(raw.dcConnectorType)
    ? raw.dcConnectorType
    : 'CCS2';

  return {
    id,
    make,
    model,
    displayName,
    acConnectorType,
    dcConnectorType,
    isFastChargingSupported: Boolean(raw.isFastChargingSupported),
  };
}

export async function fetchPublicVehicleModels(options?: {
  search?: string;
  all?: boolean;
}): Promise<VehicleCatalogItem[]> {
  const query = new URLSearchParams({
    all: String(options?.all ?? true),
  });

  const trimmedSearch = options?.search?.trim();
  if (trimmedSearch) {
    query.set('search', trimmedSearch);
  }

  let response: Response;
  try {
    response = await fetch(
      `${env.apiBaseUrl}/api/public/vehicle-models?${query.toString()}`,
      { headers: { Accept: 'application/json' } },
    );
  } catch {
    throw new PublicVehicleModelsApiError('Network request failed');
  }

  if (!response.ok) {
    throw new PublicVehicleModelsApiError(
      `Request failed with status ${response.status}`,
    );
  }

  let json: { data?: unknown };
  try {
    json = (await response.json()) as { data?: unknown };
  } catch {
    throw new PublicVehicleModelsApiError('Invalid response from server');
  }

  if (!Array.isArray(json.data)) {
    return [];
  }

  return json.data
    .map((item) =>
      item && typeof item === 'object'
        ? mapVehicleModel(item as Record<string, unknown>)
        : null,
    )
    .filter((item): item is VehicleCatalogItem => item !== null);
}
