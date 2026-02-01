import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  clinical_admin: 90,
  consultant: 70,
  doctor: 60,
  prescriber: 50,
  hospital_pharmacist: 40,
  pharmacy_support_manager: 35,
  pharmacy_technician: 30,
  pharmacy_support_worker: 20,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      return false;
    }

    const userRoleLevel = ROLE_HIERARCHY[user.role] ?? 0;

    return requiredRoles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role] ?? 100;
      return userRoleLevel >= requiredLevel;
    });
  }
}
