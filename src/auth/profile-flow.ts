import { getDriverVehicleDisplayName } from '@/api/driverVehicles';
import type { DriverVehicle } from '@/types/vehicle';
import type { VehicleCatalogItem } from '@/types/vehicle';

export function resumeBookingHref(pending: {
  stationId: string;
  chargerId: string;
}) {
  return {
    pathname: '/stations/[id]' as const,
    params: {
      id: pending.stationId,
      resumeChargerId: pending.chargerId,
      resumeBooking: '1',
    },
  };
}

export function formatConnectorList(
  ac?: string | null,
  dc?: string | null,
): string {
  return [ac, dc].filter(Boolean).join(' · ');
}

export function catalogItemConnectors(item: VehicleCatalogItem): string {
  return formatConnectorList(item.acConnectorType, item.dcConnectorType);
}

export function driverVehicleConnectorsLabel(vehicle: DriverVehicle): string {
  if (vehicle.vehicleModel) {
    return formatConnectorList(
      vehicle.vehicleModel.acConnectorType,
      vehicle.vehicleModel.dcConnectorType,
    );
  }

  return formatConnectorList(vehicle.acConnectorType, vehicle.dcConnectorType);
}

export function driverVehicleTitle(vehicle: DriverVehicle): string {
  return getDriverVehicleDisplayName(vehicle);
}
