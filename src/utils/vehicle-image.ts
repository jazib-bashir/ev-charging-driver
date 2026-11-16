import type { DriverVehicle, VehicleCatalogItem } from '@/types/vehicle';

export function getCatalogItemImageUrl(
  item: Pick<VehicleCatalogItem, 'image'> | null | undefined,
): string | null {
  const trimmed = item?.image?.trim();
  return trimmed || null;
}

export function getDriverVehicleImageUrl(
  vehicle: DriverVehicle,
  catalogById?: Map<string, VehicleCatalogItem>,
): string | null {
  const nested = getCatalogItemImageUrl(vehicle.vehicleModel);
  if (nested) {
    return nested;
  }

  const catalogId = vehicle.vehicleModelId ?? vehicle.vehicleModel?.id ?? null;
  if (!catalogId || !catalogById) {
    return null;
  }

  return getCatalogItemImageUrl(catalogById.get(catalogId));
}
