import { getDriverVehicleConnectors } from '@/api/driverVehicles';
import type {
  ConnectorType,
  DriverVehicle,
  VehicleCatalogItem,
} from '@/types/vehicle';

export { getDriverVehicleConnectors };

/** Unique non-null AC/DC connector types from a catalog model. */
export function getCatalogItemConnectors(
  item: VehicleCatalogItem,
): ConnectorType[] {
  const values = [item.acConnectorType, item.dcConnectorType].filter(
    (value): value is ConnectorType => Boolean(value),
  );
  return [...new Set(values)];
}

/**
 * Resolve connector types for a filter vehicle id.
 * Looks up a driver vehicle first, then a catalog model (mirrors backend
 * `resolveVehicleConnectorTypes` on already-loaded client data).
 *
 * Returns `null` when no vehicle is selected / id not found.
 * Returns an empty array when the vehicle exists but has no connectors.
 */
export function resolveFilterVehicleConnectors(
  vehicleId: string | null | undefined,
  driverVehicles: DriverVehicle[],
  catalogItems: VehicleCatalogItem[] = [],
): ConnectorType[] | null {
  if (!vehicleId) {
    return null;
  }

  const driverVehicle = driverVehicles.find((item) => item.id === vehicleId);
  if (driverVehicle) {
    return getDriverVehicleConnectors(driverVehicle) as ConnectorType[];
  }

  const catalogItem = catalogItems.find((item) => item.id === vehicleId);
  if (catalogItem) {
    return getCatalogItemConnectors(catalogItem);
  }

  return null;
}
