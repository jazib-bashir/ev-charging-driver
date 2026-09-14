import { env } from '@/config/env';

export class AuthApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

export type OtpChannel = 'phone' | 'email';

export type OtpRequestResponse = {
  challenge_id: string;
  expires_in: number;
  channel: OtpChannel;
  /** Temporary MVP testing field until SMS delivery is enabled. */
  code?: string;
};

export type AuthTokenResponse = {
  token: string;
  expires_in: number;
  token_type: string;
};

export type DriverVehicleSummary = {
  id: string;
  userId: string;
  vehicleModelId?: string | null;
  customMake?: string | null;
  customModel?: string | null;
  acConnectorType?: string | null;
  dcConnectorType?: string | null;
  isDefault: boolean;
  vehicleModel?: {
    id: string;
    make: string;
    model: string;
    displayName: string;
    acConnectorType?: string;
    dcConnectorType?: string;
  } | null;
};

export type WhoAmIResponse = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  isOnboarded?: boolean;
  defaultVehicle?: DriverVehicleSummary | null;
  metaData?: {
    isOnboarded?: boolean;
    role?: string;
    status?: string;
    [key: string]: unknown;
  };
  roles?: string[];
  permissions?: string[];
};

export function resolveHasDefaultVehicle(
  user: WhoAmIResponse | null | undefined,
): boolean {
  return Boolean(user?.defaultVehicle?.id);
}

export type UpdateDriverProfileInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string | null;
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

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthApiError('Network request failed');
  }

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new AuthApiError('Invalid response from server');
  }
}

export async function authFetch(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    return await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new AuthApiError('Network request failed');
  }
}

export async function requestOtp(identifier: string): Promise<OtpRequestResponse> {
  return postJson<OtpRequestResponse>('/api/auth/otp/request', {
    identifier: identifier.trim(),
    channel: 'phone',
  });
}

export async function verifyOtp(
  challengeId: string,
  code: string,
): Promise<AuthTokenResponse> {
  return postJson<AuthTokenResponse>('/api/auth/otp/verify', {
    challenge_id: challengeId,
    code: code.trim(),
  });
}

export async function whoAmI(token: string): Promise<WhoAmIResponse> {
  const response = await authFetch('/api/auth/whoami', token);

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  try {
    return (await response.json()) as WhoAmIResponse;
  } catch {
    throw new AuthApiError('Invalid response from server');
  }
}

export async function updateDriverProfile(
  token: string,
  payload: UpdateDriverProfileInput,
): Promise<unknown> {
  const response = await authFetch('/api/auth/driver/profile', token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new AuthApiError('Invalid response from server');
  }
}

export function resolveIsOnboarded(user: WhoAmIResponse | null | undefined): boolean {
  if (!user) {
    return false;
  }

  if (typeof user.isOnboarded === 'boolean') {
    return user.isOnboarded;
  }

  return Boolean(user.metaData?.isOnboarded);
}
