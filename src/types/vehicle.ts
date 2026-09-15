export const CONNECTOR_TYPES = [
  'CCS2',
  'Type1',
  'Type2',
  'CHAdeMO',
  'NACS',
] as const;

export type ConnectorType = (typeof CONNECTOR_TYPES)[number];

/** Catalog vehicle model from GET /api/public/vehicle-models. */
export type VehicleCatalogItem = {
  id: string;
  make: string;
  model: string;
  displayName: string;
  acConnectorType: ConnectorType;
  dcConnectorType: ConnectorType;
  isFastChargingSupported: boolean;
};

export type DriverVehicle = {
  id: string;
  userId: string;
  vehicleModelId?: string | null;
  customMake?: string | null;
  customModel?: string | null;
  licensePlate?: string | null;
  acConnectorType?: ConnectorType | null;
  dcConnectorType?: ConnectorType | null;
  isDefault: boolean;
  vehicleModel?: VehicleCatalogItem | null;
  createdAt?: string;
  updatedAt?: string;
};
