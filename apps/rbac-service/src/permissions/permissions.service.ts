import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { UserPermissionEntity } from './entities/user-permission.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { ResourceEntity } from '../resources/entities/resource.entity';
import { ActionEntity } from '../actions/entities/action.entity';
import { CreatePermissionDto, CheckPermissionDto, GrantUserPermissionDto } from './dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionRepository: Repository<RolePermissionEntity>,
    @InjectRepository(UserPermissionEntity)
    private readonly userPermissionRepository: Repository<UserPermissionEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(ResourceEntity)
    private readonly resourceRepository: Repository<ResourceEntity>,
    @InjectRepository(ActionEntity)
    private readonly actionRepository: Repository<ActionEntity>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<PermissionEntity> {
    const { resourceId, actionId, scope = 'all' } = createPermissionDto;

    // Verify resource and action exist
    const resource = await this.resourceRepository.findOne({ where: { id: resourceId } });
    if (!resource) {
      throw new NotFoundException(`Resource with ID '${resourceId}' not found`);
    }

    const action = await this.actionRepository.findOne({ where: { id: actionId } });
    if (!action) {
      throw new NotFoundException(`Action with ID '${actionId}' not found`);
    }

    // Check for existing permission
    const existing = await this.permissionRepository.findOne({
      where: { resourceId, actionId, scope },
    });

    if (existing) {
      throw new ConflictException(
        `Permission '${resource.name}:${action.name}:${scope}' already exists`,
      );
    }

    const name = `${resource.name}:${action.name}:${scope}`;
    const displayName = `${resource.displayName} - ${action.displayName} (${scope})`;

    const permission = this.permissionRepository.create({
      ...createPermissionDto,
      scope,
      name,
      displayName,
    });

    return this.permissionRepository.save(permission);
  }

  async findAll(): Promise<PermissionEntity[]> {
    return this.permissionRepository.find({
      where: { isActive: true },
      relations: ['resource', 'action'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<PermissionEntity> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['resource', 'action'],
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }

    return permission;
  }

  async checkPermission(checkDto: CheckPermissionDto): Promise<{
    allowed: boolean;
    source: 'user_grant' | 'user_deny' | 'role' | 'denied';
    permission?: string;
  }> {
    const { userId, userRole, resource, action, scope = 'all' } = checkDto;

    // 1. Check for user-level deny (highest priority)
    const userDeny = await this.userPermissionRepository
      .createQueryBuilder('up')
      .innerJoin('up.permission', 'p')
      .innerJoin('p.resource', 'r')
      .innerJoin('p.action', 'a')
      .where('up.userId = :userId', { userId })
      .andWhere('up.type = :type', { type: 'deny' })
      .andWhere('r.name = :resource', { resource })
      .andWhere('a.name = :action', { action })
      .andWhere('(p.scope = :scope OR p.scope = :allScope)', { scope, allScope: 'all' })
      .andWhere('(up.expiresAt IS NULL OR up.expiresAt > :now)', { now: new Date() })
      .getOne();

    if (userDeny) {
      return { allowed: false, source: 'user_deny' };
    }

    // 2. Check for user-level grant
    const userGrant = await this.userPermissionRepository
      .createQueryBuilder('up')
      .innerJoin('up.permission', 'p')
      .innerJoin('p.resource', 'r')
      .innerJoin('p.action', 'a')
      .where('up.userId = :userId', { userId })
      .andWhere('up.type = :type', { type: 'grant' })
      .andWhere('r.name = :resource', { resource })
      .andWhere('a.name = :action', { action })
      .andWhere('(p.scope = :scope OR p.scope = :allScope)', { scope, allScope: 'all' })
      .andWhere('(up.expiresAt IS NULL OR up.expiresAt > :now)', { now: new Date() })
      .getOne();

    if (userGrant) {
      return {
        allowed: true,
        source: 'user_grant',
        permission: `${resource}:${action}:${scope}`,
      };
    }

    // 3. Check role-based permission
    const role = await this.roleRepository.findOne({ where: { name: userRole } });
    if (!role) {
      return { allowed: false, source: 'denied' };
    }

    const rolePermission = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .innerJoin('rp.permission', 'p')
      .innerJoin('p.resource', 'r')
      .innerJoin('p.action', 'a')
      .where('rp.roleId = :roleId', { roleId: role.id })
      .andWhere('r.name = :resource', { resource })
      .andWhere('a.name = :action', { action })
      .andWhere('(p.scope = :scope OR p.scope = :allScope)', { scope, allScope: 'all' })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .getOne();

    if (rolePermission) {
      return {
        allowed: true,
        source: 'role',
        permission: `${resource}:${action}:${scope}`,
      };
    }

    return { allowed: false, source: 'denied' };
  }

  async getUserPermissions(userId: string, userRole: string): Promise<string[]> {
    const permissions = new Set<string>();

    // Get role-based permissions
    const role = await this.roleRepository.findOne({ where: { name: userRole } });
    if (role) {
      const rolePermissions = await this.rolePermissionRepository.find({
        where: { roleId: role.id },
        relations: ['permission', 'permission.resource', 'permission.action'],
      });

      for (const rp of rolePermissions) {
        if (rp.permission.isActive) {
          permissions.add(rp.permission.name);
        }
      }
    }

    // Add user-level grants
    const userGrants = await this.userPermissionRepository.find({
      where: {
        userId,
        type: 'grant',
      },
      relations: ['permission', 'permission.resource', 'permission.action'],
    });

    for (const ug of userGrants) {
      if (!ug.expiresAt || ug.expiresAt > new Date()) {
        permissions.add(ug.permission.name);
      }
    }

    // Remove user-level denies
    const userDenies = await this.userPermissionRepository.find({
      where: {
        userId,
        type: 'deny',
      },
      relations: ['permission'],
    });

    for (const ud of userDenies) {
      if (!ud.expiresAt || ud.expiresAt > new Date()) {
        permissions.delete(ud.permission.name);
      }
    }

    return Array.from(permissions).sort();
  }

  async grantUserPermission(
    userId: string,
    grantDto: GrantUserPermissionDto,
    grantedBy?: string,
  ): Promise<UserPermissionEntity> {
    const { permissionId, type = 'grant', reason, expiresAt } = grantDto;

    // Verify permission exists
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID '${permissionId}' not found`);
    }

    // Check for existing user permission
    const existing = await this.userPermissionRepository.findOne({
      where: { userId, permissionId },
    });

    if (existing) {
      // Update existing
      existing.type = type;
      existing.reason = reason ?? null;
      existing.expiresAt = expiresAt ? new Date(expiresAt) : null;
      existing.grantedBy = grantedBy ?? null;
      return this.userPermissionRepository.save(existing);
    }

    // Create new
    const userPermission = this.userPermissionRepository.create({
      userId,
      permissionId,
      type,
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      grantedBy,
    });

    return this.userPermissionRepository.save(userPermission);
  }

  async revokeUserPermission(userId: string, permissionId: string): Promise<void> {
    const result = await this.userPermissionRepository.delete({
      userId,
      permissionId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('User permission not found');
    }
  }
}
