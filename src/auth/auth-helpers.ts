/**
 * Temporary MVP helper: when the OTP request API returns `code`,
 * auto-fill the OTP input for local testing until SMS delivery is enabled.
 * Remove or no-op this for production SMS verification.
 */
export function getDevAutoFillOtp(code: string | undefined): string {
  return typeof code === 'string' ? code.trim() : '';
}

export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const PAKISTAN_DIAL_CODE = '+92';

/**
 * Normalize a Pakistan local mobile number to digits only (no country code).
 * Strips spaces, leading 0, and accidental 92/ +92 prefixes.
 */
export function normalizePkLocalNumber(input: string): string {
  let digits = input.replace(/\D/g, '');

  if (digits.startsWith('92') && digits.length > 10) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

export function toE164Pk(localNumber: string): string {
  const local = normalizePkLocalNumber(localNumber);
  return `${PAKISTAN_DIAL_CODE}${local}`;
}

/** Valid PK mobile: 10 digits starting with 3 (e.g. 3001234567). */
export function isValidPkMobile(localNumber: string): boolean {
  const local = normalizePkLocalNumber(localNumber);
  return /^3\d{9}$/.test(local);
}

export function formatPkLocalDisplay(localNumber: string): string {
  const local = normalizePkLocalNumber(localNumber);
  if (local.length <= 3) {
    return local;
  }

  return `${local.slice(0, 3)} ${local.slice(3)}`;
}

export function maskE164ForDisplay(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length < 4) {
    return e164;
  }

  const visible = digits.slice(-4);
  return `${PAKISTAN_DIAL_CODE} ******${visible}`;
}

export function fromE164PkToLocal(phoneNumber: string | null | undefined): string {
  if (!phoneNumber?.trim()) {
    return '';
  }

  const digits = phoneNumber.replace(/\D/g, '');

  if (digits.startsWith('92') && digits.length > 10) {
    return normalizePkLocalNumber(digits.slice(2));
  }

  return normalizePkLocalNumber(digits);
}
