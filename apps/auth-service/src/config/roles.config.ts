/**
 * Centralized Role Configuration for Auth Service
 *
 * To add a new role:
 * 1. Add the role key to the ROLES object below
 * 2. The role will automatically be available for user registration
 * 3. Update the frontend permissions if needed (packages/shared-types/src/roles/index.ts)
 */

// ============================================
// ROLE DEFINITIONS
// Add new roles here
// ============================================

export const ROLES = {
  // Administrative roles
  SUPER_ADMIN: 'super_admin',
  CLINICAL_ADMIN: 'clinical_admin',

  // Clinical roles
  CONSULTANT: 'consultant',
  DOCTOR: 'doctor',
  PRESCRIBER: 'prescriber',

  // Pharmacy roles
  HOSPITAL_PHARMACIST: 'hospital_pharmacist',
  PHARMACY_TECHNICIAN: 'pharmacy_technician',
  PHARMACY_SUPPORT_WORKER: 'pharmacy_support_worker',
  PHARMACY_SUPPORT_MANAGER: 'pharmacy_support_manager',

  // ============================================
  // ADD NEW ROLES BELOW THIS LINE
  // ============================================
  // TEMP: 'temp',
  // NURSE: 'nurse',
  // RECEPTIONIST: 'receptionist',
  // LAB_TECHNICIAN: 'lab_technician',
} as const;

// Generate the UserRole type from ROLES object
export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// Array of all valid roles (used for validation)
export const ALL_ROLES: UserRole[] = Object.values(ROLES);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a role string is a valid UserRole
 */
export function isValidRole(role: string): role is UserRole {
  return ALL_ROLES.includes(role as UserRole);
}

/**
 * Get role display name (formatted for UI)
 */
export function getRoleDisplayName(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: string | undefined): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.CLINICAL_ADMIN;
}

/**
 * Roles that can register new users
 */
export const ROLES_THAT_CAN_REGISTER_USERS: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.CLINICAL_ADMIN,
];

/**
 * Roles that can manage other users
 */
export const ROLES_THAT_CAN_MANAGE_USERS: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.CLINICAL_ADMIN,
];
