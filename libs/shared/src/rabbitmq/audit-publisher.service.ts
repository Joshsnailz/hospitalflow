import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQPublisherService } from './rabbitmq-publisher.service';
import { AuditLogEvent, DataAccessLogEvent } from './event-types';

export interface AuditContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
}

@Injectable()
export class AuditPublisherService {
  private readonly logger = new Logger(AuditPublisherService.name);

  constructor(private readonly rabbitMQPublisher: RabbitMQPublisherService) {}

  /**
   * Log a general action (login, create, update, delete, etc.)
   */
  async logAction(
    action: string,
    resource: string,
    status: 'success' | 'failure' | 'error',
    context: AuditContext,
    details?: {
      resourceId?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      errorMessage?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    try {
      const payload: AuditLogEvent['payload'] = {
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        action,
        resource,
        status,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId: context.requestId,
        sessionId: context.sessionId,
        resourceId: details?.resourceId,
        oldValues: details?.oldValues,
        newValues: details?.newValues,
        errorMessage: details?.errorMessage,
        metadata: details?.metadata,
      };

      await this.rabbitMQPublisher.publishAuditLog(payload, context.correlationId);
    } catch (error) {
      this.logger.error(`Failed to publish audit log: ${error.message}`);
    }
  }

  /**
   * Log user login
   */
  async logLogin(
    email: string,
    success: boolean,
    context: Partial<AuditContext>,
    errorMessage?: string,
  ): Promise<void> {
    await this.logAction(
      'user.login',
      'auth',
      success ? 'success' : 'failure',
      { ...context, userEmail: email } as AuditContext,
      { errorMessage },
    );
  }

  /**
   * Log user logout
   */
  async logLogout(context: AuditContext): Promise<void> {
    await this.logAction('user.logout', 'auth', 'success', context);
  }

  /**
   * Log user creation
   */
  async logUserCreated(
    newUserId: string,
    newUserEmail: string,
    newUserRole: string,
    context: AuditContext,
  ): Promise<void> {
    await this.logAction(
      'user.create',
      'user',
      'success',
      context,
      {
        resourceId: newUserId,
        newValues: { email: newUserEmail, role: newUserRole },
      },
    );
  }

  /**
   * Log user update
   */
  async logUserUpdated(
    userId: string,
    changes: Record<string, { old: any; new: any }>,
    context: AuditContext,
  ): Promise<void> {
    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    Object.entries(changes).forEach(([key, value]) => {
      oldValues[key] = value.old;
      newValues[key] = value.new;
    });

    await this.logAction(
      'user.update',
      'user',
      'success',
      context,
      { resourceId: userId, oldValues, newValues },
    );
  }

  /**
   * Log user role change
   */
  async logRoleChanged(
    userId: string,
    oldRole: string,
    newRole: string,
    context: AuditContext,
  ): Promise<void> {
    await this.logAction(
      'user.role.change',
      'user',
      'success',
      context,
      {
        resourceId: userId,
        oldValues: { role: oldRole },
        newValues: { role: newRole },
      },
    );
  }

  /**
   * Log patient data access (PHI)
   */
  async logPatientAccess(
    patientId: string,
    accessType: 'read' | 'write' | 'delete' | 'export',
    dataType: string,
    context: AuditContext,
    details?: {
      patientMrn?: string;
      sensitivityLevel?: 'low' | 'medium' | 'high' | 'phi';
      fieldsAccessed?: string[];
      isEmergencyAccess?: boolean;
      breakGlassReason?: string;
    },
  ): Promise<void> {
    try {
      const payload: DataAccessLogEvent['payload'] = {
        userId: context.userId!,
        userEmail: context.userEmail!,
        userRole: context.userRole!,
        patientId,
        patientMrn: details?.patientMrn,
        dataType,
        accessType,
        sensitivityLevel: details?.sensitivityLevel || 'phi',
        fieldsAccessed: details?.fieldsAccessed,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        isEmergencyAccess: details?.isEmergencyAccess,
        breakGlassReason: details?.breakGlassReason,
      };

      await this.rabbitMQPublisher.publishDataAccessLog(payload, context.correlationId);
    } catch (error) {
      this.logger.error(`Failed to publish data access log: ${error.message}`);
    }
  }

  /**
   * Log permission change
   */
  async logPermissionChange(
    action: 'grant' | 'revoke',
    targetUserId: string,
    permission: string,
    context: AuditContext,
  ): Promise<void> {
    await this.logAction(
      `permission.${action}`,
      'rbac',
      'success',
      context,
      {
        resourceId: targetUserId,
        newValues: { permission, action },
      },
    );
  }

  /**
   * Log generic resource access
   */
  async logResourceAccess(
    resource: string,
    resourceId: string,
    action: string,
    context: AuditContext,
  ): Promise<void> {
    await this.logAction(
      `${resource}.${action}`,
      resource,
      'success',
      context,
      { resourceId },
    );
  }

  /**
   * Log error/exception
   */
  async logError(
    action: string,
    resource: string,
    errorMessage: string,
    context: AuditContext,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logAction(
      action,
      resource,
      'error',
      context,
      { errorMessage, metadata },
    );
  }
}
