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

function normalizeVehicleText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Short display ID from the saved vehicle record. */
export function formatVehicleRecordId(id: string): string {
  const cleaned = id.replace(/[^a-zA-Z0-9]/g, '');

  if (cleaned.length <= 8) {
    return cleaned.toUpperCase();
  }

  return cleaned.slice(-8).toUpperCase();
}

/** Secondary line for profile cards — only when API data adds meaning beyond the title. */
export function getVehicleProfileSubtitle(
  vehicle: DriverVehicle,
  title: string,
): string | null {
  const parts: string[] = [];

  if (vehicle.vehicleModel) {
    const make = vehicle.vehicleModel.make?.trim();
    const model = vehicle.vehicleModel.model?.trim();
    const normalizedTitle = normalizeVehicleText(title);

    if (make && model) {
      const combined = normalizeVehicleText(`${make} ${model}`);
      if (
        combined !== normalizedTitle &&
        !normalizedTitle.includes(combined) &&
        !combined.includes(normalizedTitle)
      ) {
        parts.push(`${make} ${model}`);
      }
    } else if (model) {
      const normalizedModel = normalizeVehicleText(model);
      if (
        normalizedModel !== normalizedTitle &&
        !normalizedTitle.includes(normalizedModel)
      ) {
        parts.push(model);
      }
    }
  } else {
    const customMake = vehicle.customMake?.trim();
    const customModel = vehicle.customModel?.trim();
    const normalizedTitle = normalizeVehicleText(title);

    if (customMake && customModel) {
      const combined = normalizeVehicleText(`${customMake} ${customModel}`);
      if (
        combined !== normalizedTitle &&
        !normalizedTitle.includes(combined) &&
        !combined.includes(normalizedTitle)
      ) {
        parts.push(`${customMake} ${customModel}`);
      }
    } else if (customMake && normalizeVehicleText(customMake) !== normalizedTitle) {
      parts.push(customMake);
    } else if (customModel && normalizeVehicleText(customModel) !== normalizedTitle) {
      parts.push(customModel);
    }
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}
