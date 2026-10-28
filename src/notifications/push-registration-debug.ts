const LOG_PREFIX = '[push-reg]';

export function pushRegLog(message: string, details?: Record<string, unknown>): void {
  if (details) {
    console.warn(LOG_PREFIX, message, details);
    return;
  }

  console.warn(LOG_PREFIX, message);
}

export function summarizeExpoPushToken(expoPushToken: string | null | undefined): string | null {
  if (!expoPushToken?.trim()) {
    return null;
  }

  const token = expoPushToken.trim();

  if (token.length <= 12) {
    return '…';
  }

  return `${token.slice(0, 8)}…`;
}

export function sanitizeRegistrationError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const details: Record<string, unknown> = {
      name: error.name,
      message: error.message,
    };

    if ('status' in error && typeof (error as { status?: unknown }).status === 'number') {
      details.status = (error as { status: number }).status;
    }

    return details;
  }

  return { message: String(error) };
}
