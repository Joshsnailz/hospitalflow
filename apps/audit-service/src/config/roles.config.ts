/**
 * Role definitions for the Clinical Portal
 * Matches the role configuration across all services
 */
export const ROLES = {
  // Admin
  SUPER_ADMIN: 'super_admin',
  CLINICAL_ADMIN: 'clinical_admin',

  // Clinical
  CONSULTANT: 'consultant',
  DOCTOR: 'doctor',
  PRESCRIBER: 'prescriber',

  // Pharmacy
  HOSPITAL_PHARMACIST: 'hospital_pharmacist',
  PHARMACY_TECHNICIAN: 'pharmacy_technician',
  PHARMACY_SUPPORT_WORKER: 'pharmacy_support_worker',
  PHARMACY_SUPPORT_MANAGER: 'pharmacy_support_manager',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
export const ALL_ROLES: UserRole[] = Object.values(ROLES);

/**
 * Role hierarchy for permission inheritance
 * Higher number = more privileges
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.CLINICAL_ADMIN]: 90,
  [ROLES.CONSULTANT]: 70,
  [ROLES.DOCTOR]: 60,
  [ROLES.PRESCRIBER]: 50,
  [ROLES.HOSPITAL_PHARMACIST]: 40,
  [ROLES.PHARMACY_SUPPORT_MANAGER]: 35,
  [ROLES.PHARMACY_TECHNICIAN]: 30,
  [ROLES.PHARMACY_SUPPORT_WORKER]: 20,
};

/**
 * Admin roles that can access audit logs
 */
export const AUDIT_ADMIN_ROLES: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.CLINICAL_ADMIN,
];

/**
 * Check if a role is an admin role
 */
export function isAdmin(role: string | undefined): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.CLINICAL_ADMIN;
}

/**
 * Get the hierarchy level for a role
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role as UserRole] ?? 0;
}

/**
 * Get a display-friendly name for a role
 */
export function getRoleDisplayName(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
