/**
 * Centralized Role & Permission Configuration for Frontend
 *
 * IMPORTANT: When adding a new role, update BOTH:
 * 1. This file (frontend permissions)
 * 2. apps/auth-service/src/config/roles.config.ts (backend validation)
 *
 * To add a new role:
 * 1. Add the role key to the ROLES object
 * 2. Define its permissions in ROLE_PERMISSIONS
 * 3. The sidebar will automatically filter based on permissions
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

// Array of all valid roles
export const ALL_ROLES: UserRole[] = Object.values(ROLES);

// ============================================
// NAVIGATION ITEMS
// ============================================

export const NAV_ITEMS = {
  // Home
  DASHBOARD: 'dashboard',

  // Patient List (dropdown)
  RECENT_PATIENTS: 'recent-patients',
  CLINICAL_DISCHARGE: 'clinical-discharge',
  PHARMACY_DISCHARGE: 'pharmacy-discharge',

  // Patient Search
  PATIENT_SEARCH: 'patient-search',

  // Clinical Apps (dropdown)
  CLINICAL_IMAGING: 'clinical-imaging',
  CONTROLLED_DRUGS: 'controlled-drugs',
  EMERGENCY_CARE: 'emergency-care',
  CONTINUED_CARE: 'continued-care',

  // Business Apps
  HELPDESK: 'helpdesk',

  // Admin
  USERS: 'users',
  SETTINGS: 'settings',
  AUDIT_TRAILS: 'audit-trails',

  // Patient Management
  PATIENTS: 'patients',
} as const;

export type NavItemId = (typeof NAV_ITEMS)[keyof typeof NAV_ITEMS];

export const ALL_NAV_ITEMS: NavItemId[] = Object.values(NAV_ITEMS);

// ============================================
// PERMISSION MATRIX
// Define what each role can access
// When adding a new role, add its permissions here
// ============================================

export const ROLE_PERMISSIONS: Record<UserRole, NavItemId[]> = {
  // ========== ADMINISTRATIVE ROLES ==========
  // Full access to everything
  [ROLES.SUPER_ADMIN]: [...ALL_NAV_ITEMS],
  [ROLES.CLINICAL_ADMIN]: [...ALL_NAV_ITEMS],

  // ========== CLINICAL ROLES ==========
  // Full clinical access, no admin
  [ROLES.CONSULTANT]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PATIENTS,
    NAV_ITEMS.RECENT_PATIENTS,
    NAV_ITEMS.CLINICAL_DISCHARGE,
    NAV_ITEMS.PATIENT_SEARCH,
    NAV_ITEMS.CLINICAL_IMAGING,
    NAV_ITEMS.CONTROLLED_DRUGS,
    NAV_ITEMS.EMERGENCY_CARE,
    NAV_ITEMS.CONTINUED_CARE,
    NAV_ITEMS.HELPDESK,
  ],
  [ROLES.DOCTOR]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PATIENTS,
    NAV_ITEMS.RECENT_PATIENTS,
    NAV_ITEMS.CLINICAL_DISCHARGE,
    NAV_ITEMS.PATIENT_SEARCH,
    NAV_ITEMS.CLINICAL_IMAGING,
    NAV_ITEMS.CONTROLLED_DRUGS,
    NAV_ITEMS.EMERGENCY_CARE,
    NAV_ITEMS.CONTINUED_CARE,
    NAV_ITEMS.HELPDESK,
  ],
  [ROLES.PRESCRIBER]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PATIENTS,
    NAV_ITEMS.RECENT_PATIENTS,
    NAV_ITEMS.CLINICAL_DISCHARGE,
    NAV_ITEMS.PATIENT_SEARCH,
    NAV_ITEMS.CONTROLLED_DRUGS,
    NAV_ITEMS.HELPDESK,
  ],

  // ========== PHARMACY ROLES ==========
  // Pharmacy-focused access
  [ROLES.HOSPITAL_PHARMACIST]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PATIENTS,
    NAV_ITEMS.RECENT_PATIENTS,
    NAV_ITEMS.PHARMACY_DISCHARGE,
    NAV_ITEMS.PATIENT_SEARCH,
    NAV_ITEMS.CONTROLLED_DRUGS,
    NAV_ITEMS.HELPDESK,
  ],
  [ROLES.PHARMACY_SUPPORT_MANAGER]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PATIENTS,
    NAV_ITEMS.RECENT_PATIENTS,
    NAV_ITEMS.PHARMACY_DISCHARGE,
    NAV_ITEMS.PATIENT_SEARCH,
    NAV_ITEMS.HELPDESK,
  ],
  [ROLES.PHARMACY_TECHNICIAN]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PATIENTS,
    NAV_ITEMS.PHARMACY_DISCHARGE,
    NAV_ITEMS.PATIENT_SEARCH,
    NAV_ITEMS.HELPDESK,
  ],
  [ROLES.PHARMACY_SUPPORT_WORKER]: [
    NAV_ITEMS.DASHBOARD,
    NAV_ITEMS.PATIENTS,
    NAV_ITEMS.PHARMACY_DISCHARGE,
    NAV_ITEMS.PATIENT_SEARCH,
    NAV_ITEMS.HELPDESK,
  ],

  // ========== ADD NEW ROLE PERMISSIONS BELOW ==========
  // Example:
  // [ROLES.TEMP]: [NAV_ITEMS.DASHBOARD],
  // [ROLES.NURSE]: [NAV_ITEMS.DASHBOARD, NAV_ITEMS.RECENT_PATIENTS],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a user role has permission to access a specific navigation item
 */
export function hasPermission(role: string | undefined, itemId: NavItemId): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role as UserRole];
  if (!permissions) {
    // Unknown role - default to dashboard only for safety
    console.warn(`Unknown role "${role}" - defaulting to minimal permissions`);
    return itemId === NAV_ITEMS.DASHBOARD;
  }
  return permissions.includes(itemId);
}

/**
 * Get all permitted navigation item IDs for a given role
 */
export function getPermittedNavItems(role: string | undefined): NavItemId[] {
  if (!role) return [];
  const permissions = ROLE_PERMISSIONS[role as UserRole];
  if (!permissions) {
    // Unknown role - default to dashboard only
    return [NAV_ITEMS.DASHBOARD];
  }
  return permissions;
}

/**
 * Check if a role is valid/known
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
  const prescriberRoles: UserRole[] = [
    ROLES.SUPER_ADMIN,
    ROLES.CLINICAL_ADMIN,
    ROLES.CONSULTANT,
    ROLES.DOCTOR,
    ROLES.PRESCRIBER,
  ];
  return prescriberRoles.includes(role as UserRole);
}

/**
 * Check if user is pharmacy staff
 */
export function isPharmacyStaff(role: string | undefined): boolean {
  const pharmacyRoles: UserRole[] = [
    ROLES.HOSPITAL_PHARMACIST,
    ROLES.PHARMACY_TECHNICIAN,
    ROLES.PHARMACY_SUPPORT_WORKER,
    ROLES.PHARMACY_SUPPORT_MANAGER,
  ];
  return pharmacyRoles.includes(role as UserRole);
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
