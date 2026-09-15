import { AuthApiError, authFetch } from '@/api/auth';
import type {
  ChargingSession,
  ChargingSessionDetail,
  ChargingSessionStatus,
  ChargingSessionStopReason,
  ChargingSessionsPagination,
} from '@/types/charging-session';

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as { message?: string };
    if (typeof json.message === 'string' && json.message.trim()) {
      return json.message;
    }
  } catch {
    // ignore
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

function mapChargingSession(raw: Record<string, unknown>): ChargingSession {
  return {
    id: String(raw.id ?? ''),
    organizationId: String(raw.organizationId ?? ''),
    stationId: String(raw.stationId ?? ''),
    chargerId: String(raw.chargerId ?? ''),
    evseId: String(raw.evseId ?? ''),
    connectorId: String(raw.connectorId ?? ''),
    driverUserId: String(raw.driverUserId ?? ''),
    vehicleId: (raw.vehicleId as string | null | undefined) ?? null,
    queueMemberId: (raw.queueMemberId as string | null | undefined) ?? null,
    status: raw.status as ChargingSessionStatus,
    startedAt: String(raw.startedAt ?? ''),
    endedAt: (raw.endedAt as string | null | undefined) ?? null,
    durationSeconds:
      raw.durationSeconds === null || raw.durationSeconds === undefined
        ? null
        : Number(raw.durationSeconds),
    energyKwh:
      raw.energyKwh === null || raw.energyKwh === undefined
        ? null
        : Number(raw.energyKwh),
    averagePowerKw:
      raw.averagePowerKw === null || raw.averagePowerKw === undefined
        ? null
        : Number(raw.averagePowerKw),
    maxPowerKw:
      raw.maxPowerKw === null || raw.maxPowerKw === undefined
        ? null
        : Number(raw.maxPowerKw),
    pricePerKwh:
      raw.pricePerKwh === null || raw.pricePerKwh === undefined
        ? null
        : Number(raw.pricePerKwh),
    totalCost:
      raw.totalCost === null || raw.totalCost === undefined
        ? null
        : Number(raw.totalCost),
    stopReason: (raw.stopReason as ChargingSessionStopReason | null | undefined) ?? null,
    stationName: (raw.stationName as string | null | undefined) ?? null,
    chargerName: (raw.chargerName as string | null | undefined) ?? null,
    evseLabel: (raw.evseLabel as string | null | undefined) ?? null,
    connectorLabel: (raw.connectorLabel as string | null | undefined) ?? null,
    vehicleLabel: (raw.vehicleLabel as string | null | undefined) ?? null,
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

function mapTimelineEvent(raw: Record<string, unknown>) {
  return {
    type: String(raw.type ?? ''),
    status: raw.status as ChargingSession['status'],
    at: String(raw.at ?? ''),
    stopReason: (raw.stopReason as ChargingSessionStopReason | null | undefined) ?? null,
    durationSeconds:
      raw.durationSeconds === null || raw.durationSeconds === undefined
        ? null
        : Number(raw.durationSeconds),
  };
}

function mapChargingSessionDetail(raw: Record<string, unknown>): ChargingSessionDetail {
  const session = mapChargingSession(
    (raw.session as Record<string, unknown> | undefined) ?? raw,
  );

  return {
    session,
    station: (raw.station as Record<string, unknown> | null | undefined) ?? null,
    charger: (raw.charger as Record<string, unknown> | null | undefined) ?? null,
    evse: (raw.evse as Record<string, unknown> | null | undefined) ?? null,
    connector: (raw.connector as Record<string, unknown> | null | undefined) ?? null,
    driver:
      (raw.driver as ChargingSessionDetail['driver'] | null | undefined) ?? null,
    vehicle:
      (raw.vehicle as ChargingSessionDetail['vehicle'] | null | undefined) ?? null,
    queueMember:
      (raw.queueMember as ChargingSessionDetail['queueMember'] | null | undefined) ??
      null,
    timeline: Array.isArray(raw.timeline)
      ? raw.timeline.map((item) => mapTimelineEvent(item as Record<string, unknown>))
      : [],
  };
}

export type ListDriverChargingSessionsParams = {
  page?: number;
  limit?: number;
  status?: ChargingSessionStatus;
};

export async function listDriverChargingSessions(
  token: string,
  params: ListDriverChargingSessionsParams = {},
): Promise<{ data: ChargingSession[]; pagination: ChargingSessionsPagination }> {
  const query = new URLSearchParams();

  if (params.page) {
    query.set('page', String(params.page));
  }

  if (params.limit) {
    query.set('limit', String(params.limit));
  }

  if (params.status) {
    query.set('status', params.status);
  }

  const suffix = query.toString();
  const path = suffix
    ? `/api/driver/charging-sessions?${suffix}`
    : '/api/driver/charging-sessions';

  const response = await authFetch(path, token);

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  const json = await parseJsonBody<{
    data: Record<string, unknown>[];
    pagination: ChargingSessionsPagination;
  }>(response);

  return {
    data: (json.data ?? []).map((item) => mapChargingSession(item)),
    pagination: json.pagination,
  };
}

export async function getActiveDriverChargingSession(
  token: string,
): Promise<ChargingSession | null> {
  const response = await authFetch('/api/driver/charging-sessions/active', token);

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  const json = await parseJsonBody<{ session: Record<string, unknown> | null }>(response);

  if (!json.session) {
    return null;
  }

  return mapChargingSession(json.session);
}

export async function getChargingSessionDetail(
  token: string,
  sessionId: string,
): Promise<ChargingSessionDetail> {
  const response = await authFetch(
    `/api/driver/charging-sessions/${encodeURIComponent(sessionId)}`,
    token,
  );

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  const json = await parseJsonBody<Record<string, unknown>>(response);
  return mapChargingSessionDetail(json);
}

export async function stopDriverChargingSession(
  token: string,
  sessionId: string,
  stopReason: ChargingSessionStopReason = 'DRIVER_STOP',
): Promise<ChargingSession> {
  const response = await authFetch(
    `/api/driver/charging-sessions/${encodeURIComponent(sessionId)}/stop`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ stopReason }),
    },
  );

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  const json = await parseJsonBody<Record<string, unknown>>(response);
  return mapChargingSession(json);
}
