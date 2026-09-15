type ConnectorLike = {
  displayName?: string | null;
  connectorType?: string;
  connectorNumber?: number | null;
  id?: string;
};

type EvseLike = {
  label?: string;
};

const EMPTY = '—';

function isTechnicalId(value: string): boolean {
  return value.length > 28 || value.includes('dev-seed');
}

export function formatConnectorLabel(
  connector?: ConnectorLike | null,
  fallbackId?: string,
): string {
  if (connector) {
    const name = connector.displayName ?? connector.connectorType;
    if (name) {
      return connector.connectorNumber != null ? `${name} #${connector.connectorNumber}` : name;
    }
  }

  if (fallbackId && !isTechnicalId(fallbackId)) {
    return fallbackId;
  }

  return EMPTY;
}

export function formatEvseLabel(
  evse?: EvseLike | null,
  chargerName?: string,
  fallbackId?: string,
): string {
  if (evse?.label) {
    return evse.label;
  }

  if (chargerName) {
    return chargerName;
  }

  if (fallbackId && !isTechnicalId(fallbackId)) {
    return fallbackId;
  }

  return EMPTY;
}

export function formatVehicleLabel(
  vehicle?: { make: string; model: string } | null,
  vehicleId?: string | null,
): string {
  if (vehicle) {
    return `${vehicle.make} ${vehicle.model}`.trim();
  }

  if (vehicleId && !isTechnicalId(vehicleId)) {
    return vehicleId;
  }

  return EMPTY;
}

export function truncateId(id: string, length = 8): string {
  if (id.length <= length) {
    return id;
  }

  return `${id.slice(0, length)}…`;
}
