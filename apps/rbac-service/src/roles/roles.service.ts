import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { RolePermissionEntity } from '../permissions/entities/role-permission.entity';
import { PermissionEntity } from '../permissions/entities/permission.entity';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionRepository: Repository<RolePermissionEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleEntity> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException(`Role with name '${createRoleDto.name}' already exists`);
    }

    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll(): Promise<RoleEntity[]> {
    return this.roleRepository.find({
      where: { isActive: true },
      order: { hierarchyLevel: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    return role;
  }

  async findByName(name: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({
      where: { name },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role '${name}' not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleEntity> {
    const role = await this.findOne(id);

    if (role.isSystem && updateRoleDto.isActive === false) {
      throw new ForbiddenException('Cannot deactivate system roles');
    }

    Object.assign(role, updateRoleDto);
    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new ForbiddenException('Cannot delete system roles');
    }

    await this.roleRepository.remove(role);
  }

  async assignPermissions(
    id: string,
    assignPermissionsDto: AssignPermissionsDto,
    grantedBy?: string,
  ): Promise<RoleEntity> {
    const role = await this.findOne(id);
    const { permissionIds } = assignPermissionsDto;

    // Verify all permissions exist
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds), isActive: true },
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Remove existing permissions
    await this.rolePermissionRepository.delete({ roleId: id });

    // Add new permissions
    const rolePermissions = permissionIds.map((permissionId) =>
      this.rolePermissionRepository.create({
        roleId: id,
        permissionId,
        grantedBy,
      }),
    );

    await this.rolePermissionRepository.save(rolePermissions);

    return this.findOne(id);
  }

  async getRolePermissions(id: string): Promise<PermissionEntity[]> {
    const role = await this.findOne(id);

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: role.id },
      relations: ['permission', 'permission.resource', 'permission.action'],
    });

    return rolePermissions.map((rp) => rp.permission);
  }
}
