/**
 * Centralized Role Configuration
 *
 * To add a new role:
 * 1. Add the role key to the ROLES object below
 * 2. Define its permissions in ROLE_PERMISSIONS
 * 3. The role will automatically be available throughout the system
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

  // Other roles - Add new roles here
  // TEMP: 'temp',
  // NURSE: 'nurse',
  // RECEPTIONIST: 'receptionist',
} as const;

// Generate the UserRole type from ROLES object
export type UserRole = typeof ROLES[keyof typeof ROLES];

// Array of all valid roles (useful for validation)
export const ALL_ROLES: UserRole[] = Object.values(ROLES);

// ============================================
// NAVIGATION ITEMS
// ============================================

export const NAV_ITEMS = {
  DASHBOARD: 'dashboard',
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  RECORDS: 'records',
  PRESCRIPTIONS: 'prescriptions',
  LAB_RESULTS: 'lab-results',
  VITALS: 'vitals',
  CONSULTATIONS: 'consultations',
  USERS: 'users',
  DEPARTMENTS: 'departments',
  SETTINGS: 'settings',
} as const;

export type NavItemId = typeof NAV_ITEMS[keyof typeof NAV_ITEMS];

export const ALL_NAV_ITEMS: NavItemId[] = Object.values(NAV_ITEMS);

// ============================================
// PERMISSION MATRIX
// Define what each role can access
// ============================================

export const ROLE_PERMISSIONS: Record<UserRole, NavItemId[]> = {
  // Full access roles
  [ROLES.SUPER_ADMIN]: [...ALL_NAV_ITEMS],
  [ROLES.CLINICAL_ADMIN]: [...ALL_NAV_ITEMS],

  // Clinical roles - full clinical access, no admin
  [ROLES.CONSULTANT]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PATIENTS,
    NAV_ITEMS.APPOINTMENTS,
    NAV_ITEMS.RECORDS,
    NAV_ITEMS.PRESCRIPTIONS,
    NAV_ITEMS.LAB_RESULTS,
    NAV_ITEMS.VITALS,
    NAV_ITEMS.CONSULTATIONS,
  ],
  [ROLES.DOCTOR]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PATIENTS,
    NAV_ITEMS.APPOINTMENTS,
    NAV_ITEMS.RECORDS,
    NAV_ITEMS.PRESCRIPTIONS,
    NAV_ITEMS.LAB_RESULTS,
    NAV_ITEMS.VITALS,
    NAV_ITEMS.CONSULTATIONS,
  ],
  [ROLES.PRESCRIBER]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PATIENTS,
    NAV_ITEMS.APPOINTMENTS,
    NAV_ITEMS.RECORDS,
    NAV_ITEMS.PRESCRIPTIONS,
    NAV_ITEMS.LAB_RESULTS,
    NAV_ITEMS.VITALS,
  ],

  // Pharmacy roles - pharmacy focused access
  [ROLES.HOSPITAL_PHARMACIST]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PATIENTS,
    NAV_ITEMS.PRESCRIPTIONS,
    NAV_ITEMS.LAB_RESULTS,
  ],
  [ROLES.PHARMACY_SUPPORT_MANAGER]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PATIENTS,
    NAV_ITEMS.PRESCRIPTIONS,
  ],
  [ROLES.PHARMACY_TECHNICIAN]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PRESCRIPTIONS,
  ],
  [ROLES.PHARMACY_SUPPORT_WORKER]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PRESCRIPTIONS,
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a role has permission to access a navigation item
 */
export function hasPermission(role: string | undefined, itemId: NavItemId): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role as UserRole];
  if (!permissions) return false;
  return permissions.includes(itemId);
}

/**
 * Get all permitted navigation items for a role
 */
export function getPermittedNavItems(role: string | undefined): NavItemId[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role as UserRole] || [];
}

/**
 * Check if a role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return ALL_ROLES.includes(role as UserRole);
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: string | undefined): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.CLINICAL_ADMIN;
}

/**
 * Check if user can manage users
 */
export function canManageUsers(role: string | undefined): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.CLINICAL_ADMIN;
}

/**
 * Check if user can prescribe medications
 */
export function canPrescribe(role: string | undefined): boolean {
  return [
    ROLES.SUPER_ADMIN,
    ROLES.CLINICAL_ADMIN,
    ROLES.CONSULTANT,
    ROLES.DOCTOR,
    ROLES.PRESCRIBER,
  ].includes(role as UserRole);
}

/**
 * Check if user is pharmacy staff
 */
export function isPharmacyStaff(role: string | undefined): boolean {
  return [
    ROLES.HOSPITAL_PHARMACIST,
    ROLES.PHARMACY_TECHNICIAN,
    ROLES.PHARMACY_SUPPORT_WORKER,
    ROLES.PHARMACY_SUPPORT_MANAGER,
  ].includes(role as UserRole);
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
 * Get all roles as options for select dropdowns
 */
export function getRoleOptions(): Array<{ value: UserRole; label: string }> {
  return ALL_ROLES.map((role) => ({
    value: role,
    label: getRoleDisplayName(role),
  }));
}
