/**
 * Clinical Portal Event Types
 * ===========================
 * Defines all event types used across microservices
 */

// Event routing keys
export const EventRoutingKeys = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DEACTIVATED: 'user.deactivated',
  USER_ACTIVATED: 'user.activated',
  USER_ROLE_CHANGED: 'user.role.changed',

  // RBAC events
  RBAC_ROLE_ASSIGNED: 'rbac.role.assigned',
  RBAC_PERMISSION_GRANTED: 'rbac.permission.granted',
  RBAC_PERMISSION_REVOKED: 'rbac.permission.revoked',

  // Patient events
  PATIENT_ACCESSED: 'patient.accessed',
  PATIENT_CREATED: 'patient.created',
  PATIENT_UPDATED: 'patient.updated',

  // Audit events
  AUDIT_LOG: 'audit.log',
  AUDIT_DATA_ACCESS: 'audit.data-access',
} as const;

export type EventRoutingKey = typeof EventRoutingKeys[keyof typeof EventRoutingKeys];

// Exchange names
export const Exchanges = {
  EVENTS: 'clinical.events',
  AUDIT: 'clinical.audit',
  DLX: 'clinical.dlx',
} as const;

// Base event interface
export interface BaseEvent {
  eventId: string;
  eventType: EventRoutingKey;
  timestamp: string;
  correlationId?: string;
  source: string;
  version: string;
}

// User Events
export interface UserCreatedEvent extends BaseEvent {
  eventType: typeof EventRoutingKeys.USER_CREATED;
  payload: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phoneNumber?: string;
    createdBy?: string;
  };
}

export interface UserUpdatedEvent extends BaseEvent {
  eventType: typeof EventRoutingKeys.USER_UPDATED;
  payload: {
    userId: string;
    changes: Record<string, { old: any; new: any }>;
    updatedBy?: string;
  };
}

export interface UserDeactivatedEvent extends BaseEvent {
  eventType: typeof EventRoutingKeys.USER_DEACTIVATED;
  payload: {
    userId: string;
    email: string;
    reason?: string;
    deactivatedBy?: string;
  };
}

export interface UserActivatedEvent extends BaseEvent {
  eventType: typeof EventRoutingKeys.USER_ACTIVATED;
  payload: {
    userId: string;
    email: string;
    activatedBy?: string;
  };
}

export interface UserRoleChangedEvent extends BaseEvent {
  eventType: typeof EventRoutingKeys.USER_ROLE_CHANGED;
  payload: {
    userId: string;
    email: string;
    oldRole: string;
    newRole: string;
    changedBy?: string;
  };
}

// RBAC Events
export interface RoleAssignedEvent extends BaseEvent {
  eventType: typeof EventRoutingKeys.RBAC_ROLE_ASSIGNED;
  payload: {
    userId: string;
    roleId: string;
    roleName: string;
    assignedBy?: string;
  };
}

export interface PermissionGrantedEvent extends BaseEvent {
  eventType: typeof EventRoutingKeys.RBAC_PERMISSION_GRANTED;
  payload: {
    userId: string;
    permissionId: string;
    resource: string;
    action: string;
    grantedBy?: string;
    expiresAt?: string;
  };
}

export interface PermissionRevokedEvent extends BaseEvent {
  eventType: typeof EventRoutingKeys.RBAC_PERMISSION_REVOKED;
  payload: {
    userId: string;
    permissionId: string;
    resource: string;
    action: string;
    revokedBy?: string;
  };
}

// Patient Events
export interface PatientAccessedEvent extends BaseEvent {
  eventType: typeof EventRoutingKeys.PATIENT_ACCESSED;
  payload: {
    patientId: string;
    chiNumber: string;
    accessedBy: string;
    accessType: 'view' | 'edit' | 'create' | 'delete';
    fieldsAccessed?: string[];
    ipAddress?: string;
    userAgent?: string;
  };
}

// Audit Events
export interface AuditLogEvent extends BaseEvent {
  eventType: typeof EventRoutingKeys.AUDIT_LOG;
  payload: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    resource: string;
    resourceId?: string;
    status: 'success' | 'failure' | 'error';
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    sessionId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    errorMessage?: string;
    metadata?: Record<string, any>;
  };
}

export interface DataAccessLogEvent extends BaseEvent {
  eventType: typeof EventRoutingKeys.AUDIT_DATA_ACCESS;
  payload: {
    userId: string;
    userEmail: string;
    userRole: string;
    patientId: string;
    patientMrn?: string;
    dataType: string;
    accessType: 'read' | 'write' | 'delete' | 'export';
    sensitivityLevel: 'low' | 'medium' | 'high' | 'phi';
    fieldsAccessed?: string[];
    ipAddress?: string;
    userAgent?: string;
    isEmergencyAccess?: boolean;
    breakGlassReason?: string;
  };
}

// Union type for all events
export type ClinicalPortalEvent =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeactivatedEvent
  | UserActivatedEvent
  | UserRoleChangedEvent
  | RoleAssignedEvent
  | PermissionGrantedEvent
  | PermissionRevokedEvent
  | PatientAccessedEvent
  | AuditLogEvent
  | DataAccessLogEvent;
