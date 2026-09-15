export type ChargerConnector = {
  id: string;
  connectorType: string;
  connectorNumber?: number | null;
  displayName?: string | null;
};

export type Charger = {
  id: string;
  organizationId?: string;
  stationId?: string;
  name: string;
  serialNumber?: string | null;
  chargerType?: string | null;
  override?: boolean;
  isFastCharger?: boolean;
  setupStatus?: string | null;
  createdAt?: string;
  updatedAt?: string;
  manufacturer?: string | null;
  model?: string | null;
  maxPowerKw?: number | null;
  pricePerKwh?: number | null;
  effectivePricePerKwh?: number | null;
  completedAt?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  statusEstimate?: string | null;
  connectors?: ChargerConnector[];
};

export type ChargersResponse = {
  data: Charger[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};
