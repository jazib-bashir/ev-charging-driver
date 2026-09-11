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
  completedAt?: string | null;
  statusLabel?: string | null;
  statusEstimate?: string | null;
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
