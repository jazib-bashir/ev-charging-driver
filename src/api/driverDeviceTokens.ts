import { AuthApiError, authFetch } from '@/api/auth';
import { pushRegLog, sanitizeRegistrationError } from '@/notifications/push-registration-debug';
import { Platform } from 'react-native';

function resolveRegistrationPlatform(): 'android' | 'ios' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

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

export async function registerDriverDeviceToken(
  accessToken: string,
  expoPushToken: string,
): Promise<void> {
  pushRegLog('registerDriverDeviceToken: POST /api/driver/device-tokens');

  let response: Response;

  try {
    response = await authFetch('/api/driver/device-tokens', accessToken, {
      method: 'POST',
      body: JSON.stringify({
        token: expoPushToken,
        platform: resolveRegistrationPlatform(),
      }),
    });
  } catch (error) {
    pushRegLog('registerDriverDeviceToken: network error', {
      error: sanitizeRegistrationError(error),
    });
    throw error;
  }

  pushRegLog('registerDriverDeviceToken: response received', {
    ok: response.ok,
    status: response.status,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    pushRegLog('registerDriverDeviceToken: API error', {
      status: response.status,
      message,
    });
    throw new AuthApiError(message, response.status);
  }
}

export async function deactivateDriverDeviceToken(
  accessToken: string,
  expoPushToken: string,
): Promise<void> {
  const response = await authFetch('/api/driver/device-tokens', accessToken, {
    method: 'DELETE',
    body: JSON.stringify({
      token: expoPushToken,
    }),
  });

  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }
}
