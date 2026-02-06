/**
 * Centralized Role Configuration for User Service
 * Must be kept in sync with auth-service roles.config.ts
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  CLINICAL_ADMIN: 'clinical_admin',
  CONSULTANT: 'consultant',
  DOCTOR: 'doctor',
  PRESCRIBER: 'prescriber',
  HOSPITAL_PHARMACIST: 'hospital_pharmacist',
  PHARMACY_TECHNICIAN: 'pharmacy_technician',
  PHARMACY_SUPPORT_WORKER: 'pharmacy_support_worker',
  PHARMACY_SUPPORT_MANAGER: 'pharmacy_support_manager',
  NURSE: 'nurse',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: UserRole[] = Object.values(ROLES);

export function isValidRole(role: string): role is UserRole {
  return ALL_ROLES.includes(role as UserRole);
}

export function getRoleDisplayName(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function isAdmin(role: string | undefined): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.CLINICAL_ADMIN;
}

export const ADMIN_ROLES: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN];

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
  [ROLES.NURSE]: 55,
};
