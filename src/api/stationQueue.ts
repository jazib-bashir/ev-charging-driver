import { AuthApiError, authFetch } from '@/api/auth';
import type {
  JoinQueueRequest,
  QueueMember,
} from '@/types/queue';
import { isActiveQueueMemberState } from '@/types/queue';

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as { message?: string; error?: string };
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

function mapAllocation(
  raw: Record<string, unknown> | null | undefined,
): QueueMember['allocation'] {
  if (!raw) {
    return null;
  }

  const evseRaw = raw.evse as Record<string, unknown> | undefined;

  return {
    id: String(raw.id ?? ''),
    evseId: String(raw.evseId ?? ''),
    status: String(raw.status ?? ''),
    allocatedAt: String(raw.allocatedAt ?? ''),
    evse: evseRaw
      ? {
          id: String(evseRaw.id ?? ''),
          label: String(evseRaw.label ?? ''),
          connectorTypes: Array.isArray(evseRaw.connectorTypes)
            ? (evseRaw.connectorTypes as QueueMember['connectorPreference'][]).filter(
                Boolean,
              ) as NonNullable<QueueMember['connectorPreference']>[]
            : [],
          maxPowerKw:
            evseRaw.maxPowerKw === null || evseRaw.maxPowerKw === undefined
              ? null
              : Number(evseRaw.maxPowerKw),
          isFastCharger: Boolean(evseRaw.isFastCharger),
          status: String(evseRaw.status ?? ''),
        }
      : undefined,
  };
}

function mapQueueMember(raw: Record<string, unknown>): QueueMember {
  return {
    id: String(raw.id ?? ''),
    queueId: String(raw.queueId ?? ''),
    stationId: String(raw.stationId ?? ''),
    driverUserId: String(raw.driverUserId ?? ''),
    vehicleId: (raw.vehicleId as string | null | undefined) ?? null,
    connectorPreference:
      (raw.connectorPreference as QueueMember['connectorPreference']) ?? null,
    chargingPreference: raw.chargingPreference as QueueMember['chargingPreference'],
    position: Number(raw.position ?? 0),
    sequenceNumber:
      raw.sequenceNumber === undefined || raw.sequenceNumber === null
        ? undefined
        : Number(raw.sequenceNumber),
    currentRank:
      raw.currentRank === undefined || raw.currentRank === null
        ? undefined
        : Number(raw.currentRank),
    state: raw.state as QueueMember['state'],
    joinedAt: String(raw.joinedAt ?? ''),
    estimatedTurnAt: (raw.estimatedTurnAt as string | null | undefined) ?? null,
    arrivalWindowStart:
      (raw.arrivalWindowStart as string | null | undefined) ?? null,
    arrivalWindowEnd: (raw.arrivalWindowEnd as string | null | undefined) ?? null,
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
    allocation: mapAllocation(raw.allocation as Record<string, unknown> | null | undefined),
    needsEvseReassignment: Boolean(raw.needsEvseReassignment),
  };
}

export async function joinStationQueue(
  token: string,
  stationId: string,
  payload: JoinQueueRequest,
): Promise<QueueMember> {
  const response = await authFetch(
    `/api/stations/${encodeURIComponent(stationId)}/queue/join`,
    token,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  const json = await parseJsonBody<Record<string, unknown>>(response);
  return mapQueueMember(json);
}

export async function listDriverQueueMembers(
  token: string,
): Promise<QueueMember[]> {
  const response = await authFetch('/api/driver/queue-members/', token);

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  const json = await parseJsonBody<{ data: Record<string, unknown>[] }>(response);
  const data = Array.isArray(json.data) ? json.data : [];
  return data.map((item) => mapQueueMember(item));
}

export function findActiveMembershipForStation(
  members: QueueMember[],
  stationId: string,
): QueueMember | null {
  return (
    members.find(
      (member) =>
        member.stationId === stationId && isActiveQueueMemberState(member.state),
    ) ?? null
  );
}

export async function leaveQueueMember(
  token: string,
  queueMemberId: string,
): Promise<QueueMember> {
  const response = await authFetch(
    `/api/queue-members/${encodeURIComponent(queueMemberId)}/leave`,
    token,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  const json = await parseJsonBody<Record<string, unknown>>(response);
  return mapQueueMember(json);
}
