import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateRoleDto, UserFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser, Public } from '../auth/decorators';
import { ROLES, UserRole } from '../config/roles.config';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(ROLES.CLINICAL_ADMIN, ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const user = await this.usersService.create(createUserDto, currentUserId);
    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  @Roles(ROLES.CLINICAL_ADMIN, ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query() filterDto: UserFilterDto) {
    const result = await this.usersService.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get available user roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async getAvailableRoles() {
    const result = await this.usersService.getAvailableRoles();
    return {
      success: true,
      data: result.roles,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: { id: string; role: UserRole },
  ) {
    const isAdminOrSelf =
      currentUser.id === id ||
      [ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN].includes(currentUser.role as any);

    if (!isAdminOrSelf) {
      return {
        success: false,
        message: 'Access denied',
      };
    }

    const user = await this.usersService.findOne(id);
    return {
      success: true,
      data: user,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: { id: string; role: UserRole },
  ) {
    const isAdminOrSelf =
      currentUser.id === id ||
      [ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN].includes(currentUser.role as any);

    if (!isAdminOrSelf) {
      return {
        success: false,
        message: 'Access denied',
      };
    }

    const user = await this.usersService.update(id, updateUserDto, currentUser.id);
    return {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  @Patch(':id/role')
  @Roles(ROLES.CLINICAL_ADMIN, ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 403, description: 'Cannot modify role of user with equal or higher privileges' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() currentUser: { id: string; role: UserRole },
  ) {
    const user = await this.usersService.updateRole(id, updateRoleDto, currentUser);
    return {
      success: true,
      message: 'Role updated successfully',
      data: user,
    };
  }

  @Post(':id/activate')
  @Roles(ROLES.CLINICAL_ADMIN, ROLES.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User is already active' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    const user = await this.usersService.activate(id, currentUserId);
    return {
      success: true,
      message: 'User activated successfully',
      data: user,
    };
  }

  @Post(':id/deactivate')
  @Roles(ROLES.CLINICAL_ADMIN, ROLES.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User is already deactivated' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    const user = await this.usersService.deactivate(id, currentUserId);
    return {
      success: true,
      message: 'User deactivated successfully',
      data: user,
    };
  }

  @Delete(':id')
  @Roles(ROLES.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a user (super admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.usersService.softDelete(id, currentUserId);
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}
