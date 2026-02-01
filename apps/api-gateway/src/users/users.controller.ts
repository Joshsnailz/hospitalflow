import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(
    @Body() createUserDto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.usersService.create(createUserDto, authHeader);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filters (admin only)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.usersService.findAll(query, authHeader);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get available user roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async getAvailableRoles(@Headers('authorization') authHeader: string) {
    return this.usersService.getAvailableRoles(authHeader);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.usersService.findOne(id, authHeader);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.usersService.update(id, updateUserDto, authHeader);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update user role (admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 403, description: 'Cannot modify role of higher privilege user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: { role: string },
    @Headers('authorization') authHeader: string,
  ) {
    return this.usersService.updateRole(id, updateRoleDto, authHeader);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a user (admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User is already active' })
  async activate(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.usersService.activate(id, authHeader);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user (admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User is already deactivated' })
  async deactivate(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.usersService.deactivate(id, authHeader);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user (super admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.usersService.remove(id, authHeader);
  }
}
