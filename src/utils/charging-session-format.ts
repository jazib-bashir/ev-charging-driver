export const EMPTY_METRIC = '—';

export function hasMetricValue(value: number | null | undefined): boolean {
  return value != null && !Number.isNaN(value);
}

export function formatRecentSessionMeta(
  startedAt: string | null | undefined,
  durationSeconds: number | null | undefined,
): string {
  return formatDenseSessionMeta(startedAt, durationSeconds);
}

/** Compact station title — drops trailing filler like "Fast Charge". */
export function formatCompactStationName(
  name: string | null | undefined,
): string {
  const raw = (name ?? '').trim();
  if (!raw) {
    return 'Charging session';
  }

  const trimmed = raw
    .replace(
      /\s+(Fast Charge|EV Hub|Charging Station|Charging Hub|Station)\s*$/i,
      '',
    )
    .trim();

  return trimmed || raw;
}

/** Dense meta: "18 Sept • 17:18 • 1m 31s" */
export function formatDenseSessionMeta(
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

  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const duration = formatDurationSeconds(durationSeconds, startedAt);
  if (duration === EMPTY_METRIC) {
    return `${day} ${month} • ${time}`;
  }

  return `${day} ${month} • ${time} • ${duration}`;
}

/** Port line: "180kW • CCS2" — hardware keys only, no IDs or filler. */
export function formatChargerPortMeta(
  maxPowerKw: number | null | undefined,
  connectorLabel?: string | null,
  evseLabel?: string | null,
): string {
  const raw = [connectorLabel, evseLabel]
    .filter((part): part is string => Boolean(part && part !== EMPTY_METRIC))
    .join(' ');

  const connectorType = extractConnectorType(raw);
  const powerFromLabel = raw.match(/(\d+(?:\.\d+)?)\s*kW/i)?.[1];
  const powerKw = hasMetricValue(maxPowerKw)
    ? Math.round(maxPowerKw!)
    : powerFromLabel
      ? Math.round(Number(powerFromLabel))
      : null;

  const parts: string[] = [];
  if (powerKw != null && !Number.isNaN(powerKw)) {
    parts.push(`${powerKw}kW`);
  }
  if (connectorType) {
    parts.push(connectorType);
  }

  return parts.join(' • ');
}

function extractConnectorType(label: string): string | null {
  if (!label.trim()) {
    return null;
  }

  const known = label.match(
    /\b(CCS\s*2|CCS2|CCS|CHAdeMO|Type\s*2|GBT|NACS|Tesla)\b/i,
  );
  if (known?.[1]) {
    return known[1].replace(/\s+/g, '').replace(/^ccs$/i, 'CCS2');
  }

  const cleaned = label
    .replace(/#\d+/g, '')
    .replace(/\d+(?:\.\d+)?\s*kW/gi, '')
    .replace(/^\d+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned === EMPTY_METRIC || cleaned.length > 12) {
    return null;
  }

  return cleaned;
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

/** Design format: "18 Sept 2026, 18:22 → 18:24" */
export function formatSessionTimeRange(
  startedAt: string | null | undefined,
  endedAt?: string | null,
): string {
  if (!startedAt) {
    return EMPTY_METRIC;
  }

  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) {
    return EMPTY_METRIC;
  }

  const day = start.getDate();
  const month = start.toLocaleString('en-GB', { month: 'short' });
  const year = start.getFullYear();
  const startTime = start.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const datePart = `${day} ${month} ${year}`;

  if (!endedAt) {
    return `${datePart}, ${startTime}`;
  }

  const end = new Date(endedAt);
  if (Number.isNaN(end.getTime())) {
    return `${datePart}, ${startTime}`;
  }

  const endTime = end.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${datePart}, ${startTime} → ${endTime}`;
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
