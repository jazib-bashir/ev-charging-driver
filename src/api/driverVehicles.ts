import { AuthApiError, authFetch } from '@/api/auth';
import type { ConnectorType, DriverVehicle } from '@/types/vehicle';

export type CreateDriverVehicleInput = {
  vehicleModelId?: string;
  customMake?: string;
  customModel?: string;
  acConnectorType?: ConnectorType;
  dcConnectorType?: ConnectorType;
  isDefault?: boolean;
};

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as { message?: string };
    if (typeof json.message === 'string' && json.message.trim()) {
      return json.message;
    }
  } catch {
    // ignore parse errors
  }

  return `Request failed with status ${response.status}`;
}

async function parseJsonBody<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new AuthApiError('Invalid response from server');
  }
}

export async function listDriverVehicles(
  token: string,
): Promise<DriverVehicle[]> {
  const response = await authFetch('/api/driver/vehicles/', token);

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  const json = await parseJsonBody<{ data: DriverVehicle[] }>(response);
  return Array.isArray(json.data) ? json.data : [];
}

export async function createDriverVehicle(
  token: string,
  payload: CreateDriverVehicleInput,
): Promise<DriverVehicle> {
  const response = await authFetch('/api/driver/vehicles/', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  return parseJsonBody<DriverVehicle>(response);
}

export async function setDefaultDriverVehicle(
  token: string,
  vehicleId: string,
): Promise<DriverVehicle> {
  const response = await authFetch(
    `/api/driver/vehicles/${encodeURIComponent(vehicleId)}/default`,
    token,
    { method: 'PATCH' },
  );

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  return parseJsonBody<DriverVehicle>(response);
}

export function getDriverVehicleDisplayName(vehicle: {
  vehicleModelId?: string | null;
  customMake?: string | null;
  customModel?: string | null;
  vehicleModel?: {
    displayName?: string | null;
  } | null;
}): string {
  if (vehicle.vehicleModel?.displayName) {
    return vehicle.vehicleModel.displayName;
  }

  if (vehicle.customMake || vehicle.customModel) {
    return [vehicle.customMake, vehicle.customModel].filter(Boolean).join(' ');
  }

  if (vehicle.vehicleModelId) {
    return vehicle.vehicleModelId;
  }

  return 'Vehicle';
}

export function getDriverVehicleConnectors(vehicle: DriverVehicle): string[] {
  const fromModel = [
    vehicle.vehicleModel?.acConnectorType,
    vehicle.vehicleModel?.dcConnectorType,
  ];
  const fromCustom = [vehicle.acConnectorType, vehicle.dcConnectorType];
  const values = (vehicle.vehicleModel ? fromModel : fromCustom).filter(
    (value): value is ConnectorType => Boolean(value),
  );

  return [...new Set(values)];
}
