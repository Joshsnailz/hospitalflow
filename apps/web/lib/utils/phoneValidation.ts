/**
 * Phone Number Validation for Zimbabwean Numbers
 *
 * Formats supported:
 * - Mobile: +263 7X XXX XXXX or 07X XXX XXXX
 * - Landline: +263 X XXX XXXX or 0X XXX XXXX
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string;
  errors: string[];
}

/**
 * Validate Zimbabwean phone number
 */
export function validateZimbabweanPhone(phone: string): PhoneValidationResult {
  if (!phone || phone.trim() === '') {
    return {
      isValid: true, // Empty is valid (optional field)
      errors: [],
    };
  }

  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Pattern 1: International format +263...
  const internationalPattern = /^\+263([0-9]{9})$/;

  // Pattern 2: Local format 0...
  const localPattern = /^0([0-9]{9})$/;

  const internationalMatch = cleaned.match(internationalPattern);
  const localMatch = cleaned.match(localPattern);

  if (internationalMatch) {
    const number = internationalMatch[1];

    // Check if mobile (starts with 7)
    if (number.startsWith('7')) {
      const formatted = `+263 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
      return {
        isValid: true,
        formatted,
        errors: [],
      };
    }

    // Landline
    const formatted = `+263 ${number.slice(0, 1)} ${number.slice(1, 4)} ${number.slice(4)}`;
    return {
      isValid: true,
      formatted,
      errors: [],
    };
  }

  if (localMatch) {
    const number = localMatch[1];

    // Check if mobile (starts with 7)
    if (number.startsWith('7')) {
      const formatted = `0${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
      return {
        isValid: true,
        formatted,
        errors: [],
      };
    }

    // Landline
    const formatted = `0${number.slice(0, 1)} ${number.slice(1, 4)} ${number.slice(4)}`;
    return {
      isValid: true,
      formatted,
      errors: [],
    };
  }

  // Invalid format
  return {
    isValid: false,
    errors: [
      'Invalid Zimbabwean phone format',
      'Expected: +263 7X XXX XXXX (mobile) or 07X XXX XXXX (local)',
    ],
  };
}

/**
 * Format phone number as user types
 */
export function formatPhoneAsTyping(value: string): string {
  // Remove all non-digit characters except + at start
  let cleaned = value.replace(/[^\d+]/g, '');

  // Ensure + only at start
  if (cleaned.includes('+')) {
    cleaned = '+' + cleaned.replace(/\+/g, '');
  }

  // Auto-format as user types
  if (cleaned.startsWith('+263')) {
    // International format
    const digits = cleaned.slice(4);
    if (digits.length === 0) return '+263 ';
    if (digits.length <= 2) return `+263 ${digits}`;
    if (digits.length <= 5) return `+263 ${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `+263 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
  } else if (cleaned.startsWith('0')) {
    // Local format
    const digits = cleaned.slice(1);
    if (digits.length === 0) return '0';
    if (digits.length <= 2) return `0${digits}`;
    if (digits.length <= 5) return `0${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `0${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
  }

  return cleaned;
}

/**
 * Examples for help text
 */
export const PHONE_EXAMPLES = {
  mobile: '+263 71 234 5678 or 071 234 5678',
  landline: '+263 4 123 4567 or 04 123 4567',
};
