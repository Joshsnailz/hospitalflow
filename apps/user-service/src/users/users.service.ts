import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { UserEntity, UserRole } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, UpdateRoleDto, UserFilterDto } from './dto';
import { ROLES, ROLE_HIERARCHY } from '../config/roles.config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto, createdById?: string): Promise<UserEntity> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create({
      ...createUserDto,
      role: createUserDto.role || ROLES.DOCTOR,
      createdBy: createdById,
    });

    return this.userRepository.save(user);
  }

  async findAll(filterDto: UserFilterDto): Promise<{
    data: UserEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, role, isActive, department } = filterDto;
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 10;
    const sortBy = filterDto.sortBy ?? 'createdAt';
    const sortOrder = filterDto.sortOrder ?? 'DESC';

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (role) {
      const roles = role.split(',').map((r) => r.trim()).filter(Boolean);
      if (roles.length === 1) {
        queryBuilder.andWhere('user.role = :role', { role: roles[0] });
      } else if (roles.length > 1) {
        queryBuilder.andWhere('user.role IN (:...roles)', { roles });
      }
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    if (department) {
      queryBuilder.andWhere('user.department ILIKE :department', {
        department: `%${department}%`,
      });
    }

    const validSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'role'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    queryBuilder.orderBy(`user.${sortField}`, sortOrder);

    const total = await queryBuilder.getCount();

    queryBuilder.skip((page - 1) * limit).take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    updatedById?: string,
  ): Promise<UserEntity> {
    const user = await this.findOne(id);

    Object.assign(user, {
      ...updateUserDto,
      updatedBy: updatedById,
    });

    return this.userRepository.save(user);
  }

  async updateRole(
    id: string,
    updateRoleDto: UpdateRoleDto,
    currentUser: { id: string; role: UserRole },
  ): Promise<UserEntity> {
    const user = await this.findOne(id);

    const currentUserLevel = ROLE_HIERARCHY[currentUser.role] ?? 0;
    const targetUserLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const newRoleLevel = ROLE_HIERARCHY[updateRoleDto.role] ?? 0;

    if (targetUserLevel >= currentUserLevel) {
      throw new ForbiddenException('Cannot modify role of user with equal or higher privileges');
    }

    if (newRoleLevel >= currentUserLevel) {
      throw new ForbiddenException('Cannot assign role equal to or higher than your own');
    }

    user.role = updateRoleDto.role;
    user.updatedBy = currentUser.id;

    return this.userRepository.save(user);
  }

  async activate(id: string, activatedById: string): Promise<UserEntity> {
    const user = await this.findOne(id);

    if (user.isActive) {
      throw new ConflictException('User is already active');
    }

    user.isActive = true;
    user.deactivatedAt = null;
    user.deactivatedBy = null;
    user.updatedBy = activatedById;

    return this.userRepository.save(user);
  }

  async deactivate(id: string, deactivatedById: string): Promise<UserEntity> {
    const user = await this.findOne(id);

    if (!user.isActive) {
      throw new ConflictException('User is already deactivated');
    }

    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivatedBy = deactivatedById;
    user.updatedBy = deactivatedById;

    return this.userRepository.save(user);
  }

  async softDelete(id: string, deletedById: string): Promise<void> {
    const user = await this.findOne(id);

    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivatedBy = deletedById;
    user.updatedBy = deletedById;

    await this.userRepository.save(user);
  }

  async getAvailableRoles(): Promise<{ roles: { value: string; label: string }[] }> {
    const roles = Object.entries(ROLES).map(([key, value]) => ({
      value,
      label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    }));

    return { roles };
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }
}
