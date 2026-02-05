/**
 * CHI Number Validation Utilities
 *
 * CHI Number Format: NPPPPPPPLPP (11 characters)
 * - N = 1-9 (cannot start with 0)
 * - P = 0-9 (any digit)
 * - L = A-Z excluding O, U, V
 * - Valid example: 70282487G70
 */

// Regex pattern for CHI number validation
export const CHI_NUMBER_REGEX = /^[1-9]\d{7}[A-NP-TV-Z]\d{2}$/;

/**
 * Validates a CHI number format
 * @param chi The CHI number to validate
 * @returns true if valid, false otherwise
 */
export function isValidChiNumber(chi: string): boolean {
  if (!chi || typeof chi !== 'string') {
    return false;
  }

  return CHI_NUMBER_REGEX.test(chi.toUpperCase());
}

/**
 * Validates and returns detailed information about a CHI number
 * @param chi The CHI number to validate
 * @returns Object with validation result and details
 */
export function validateChiNumber(chi: string): {
  isValid: boolean;
  normalizedChi: string | null;
  errors: string[];
} {
  const errors: string[] = [];

  if (!chi || typeof chi !== 'string') {
    return {
      isValid: false,
      normalizedChi: null,
      errors: ['CHI number is required'],
    };
  }

  const normalizedChi = chi.toUpperCase().trim();

  if (normalizedChi.length !== 11) {
    errors.push(`CHI number must be exactly 11 characters (got ${normalizedChi.length})`);
  }

  if (normalizedChi.length >= 1 && !/^[1-9]/.test(normalizedChi)) {
    errors.push('CHI number cannot start with 0');
  }

  if (normalizedChi.length >= 8 && !/^\d{8}/.test(normalizedChi)) {
    errors.push('First 8 characters must be digits');
  }

  if (normalizedChi.length >= 9) {
    const letterChar = normalizedChi[8];
    if (!/^[A-NP-TV-Z]$/.test(letterChar)) {
      errors.push(`Position 9 must be a letter A-Z excluding O, U, V (got ${letterChar})`);
    }
  }

  if (normalizedChi.length === 11 && !/\d{2}$/.test(normalizedChi)) {
    errors.push('Last 2 characters must be digits');
  }

  return {
    isValid: errors.length === 0 && CHI_NUMBER_REGEX.test(normalizedChi),
    normalizedChi: errors.length === 0 ? normalizedChi : null,
    errors,
  };
}

/**
 * Normalizes a CHI number (uppercase and trim)
 * @param chi The CHI number to normalize
 * @returns Normalized CHI number
 */
export function normalizeChiNumber(chi: string): string {
  return chi.toUpperCase().trim();
}
