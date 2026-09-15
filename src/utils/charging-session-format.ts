export const EMPTY_METRIC = '—';

export function hasMetricValue(value: number | null | undefined): boolean {
  return value != null && !Number.isNaN(value);
}

export function formatSessionDateTime(value: string | null | undefined): string {
  if (!value) {
    return EMPTY_METRIC;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_METRIC;
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatSessionDate(value: string | null | undefined): string {
  if (!value) {
    return EMPTY_METRIC;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_METRIC;
  }

  return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function formatDurationSeconds(
  seconds: number | null | undefined,
  startedAt?: string | null,
): string {
  if (seconds != null && seconds >= 0) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
  }

  if (startedAt) {
    const started = new Date(startedAt);
    if (!Number.isNaN(started.getTime())) {
      const elapsed = Math.max(0, Math.floor((Date.now() - started.getTime()) / 1000));
      return formatDurationSeconds(elapsed);
    }
  }

  return EMPTY_METRIC;
}

export function formatEnergyKwh(value: number | null | undefined): string {
  if (!hasMetricValue(value)) {
    return EMPTY_METRIC;
  }

  return `${value!.toFixed(2)} kWh`;
}

export function formatPowerKw(value: number | null | undefined): string {
  if (!hasMetricValue(value)) {
    return EMPTY_METRIC;
  }

  return `${value!.toFixed(1)} kW`;
}

export function formatPricePerKwh(value: number | null | undefined): string {
  if (!hasMetricValue(value)) {
    return EMPTY_METRIC;
  }

  return `${value!.toFixed(2)} / kWh`;
}

export function formatTotalCost(value: number | null | undefined): string {
  if (!hasMetricValue(value)) {
    return EMPTY_METRIC;
  }

  return value!.toFixed(2);
}

const STOP_REASON_LABELS: Record<string, string> = {
  DRIVER_STOP: 'Driver stopped',
  OPERATOR_STOP: 'Operator stopped',
  SESSION_COMPLETE: 'Session completed',
  SYSTEM_STOP: 'System stopped',
  ERROR: 'Error',
};

export function formatStopReason(value: string | null | undefined): string {
  if (!value) {
    return EMPTY_METRIC;
  }

  return STOP_REASON_LABELS[value] ?? value.replace(/_/g, ' ').toLowerCase();
}

const TIMELINE_LABELS: Record<string, string> = {
  STARTED: 'Session started',
  CHARGING: 'Charging',
  COMPLETED: 'Session completed',
  STOPPED: 'Session stopped',
  FAILED: 'Session failed',
  CANCELLED: 'Session cancelled',
};

export function formatTimelineEventLabel(type: string): string {
  return TIMELINE_LABELS[type] ?? type.replace(/_/g, ' ');
}
