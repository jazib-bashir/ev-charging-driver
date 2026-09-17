export const EMPTY_METRIC = '—';

export function hasMetricValue(value: number | null | undefined): boolean {
  return value != null && !Number.isNaN(value);
}

export function formatRecentSessionMeta(
  startedAt: string | null | undefined,
  durationSeconds: number | null | undefined,
): string {
  if (!startedAt) {
    return EMPTY_METRIC;
  }

  const date = new Date(startedAt);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_METRIC;
  }

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const dateLabel = isToday
    ? `Today, ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
    : date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

  let totalSeconds = durationSeconds;
  if (totalSeconds == null || totalSeconds < 0) {
    totalSeconds = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 1000),
    );
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  let durationLabel = EMPTY_METRIC;

  if (hours > 0) {
    durationLabel = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else if (minutes > 0) {
    durationLabel = `${minutes} mins`;
  } else if (totalSeconds > 0) {
    durationLabel = `${totalSeconds}s`;
  }

  if (durationLabel === EMPTY_METRIC) {
    return dateLabel;
  }

  return `${dateLabel} · ${durationLabel}`;
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

const DEFAULT_CURRENCY_CODE = 'PKR';

const CURRENCY_LOCALES: Record<string, string> = {
  PKR: 'en-PK',
  USD: 'en-US',
  CAD: 'en-CA',
  GBP: 'en-GB',
  EUR: 'de-DE',
  AED: 'en-AE',
  SGD: 'en-SG',
};

export function normalizeCurrencyCode(currency?: string | null): string {
  const normalized = currency?.trim().toUpperCase();
  return normalized || DEFAULT_CURRENCY_CODE;
}

export function formatCurrencyAmount(
  value: number | null | undefined,
  currencyCode?: string | null,
): string {
  if (!hasMetricValue(value)) {
    return EMPTY_METRIC;
  }

  const code = normalizeCurrencyCode(currencyCode);

  try {
    return new Intl.NumberFormat(CURRENCY_LOCALES[code], {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value!);
  } catch {
    return `${code} ${value!.toFixed(2)}`;
  }
}

export function formatCurrencyRate(
  value: number | null | undefined,
  currencyCode?: string | null,
): string {
  if (!hasMetricValue(value)) {
    return EMPTY_METRIC;
  }

  return `${formatCurrencyAmount(value, currencyCode)} / kWh`;
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
