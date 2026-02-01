import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('rbac')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ============ ROLES ============

  @Get('roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async getRoles(@Headers('authorization') authHeader: string) {
    return this.rbacService.getRoles(authHeader);
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  async getRole(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.rbacService.getRole(id, authHeader);
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  async createRole(
    @Body() data: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.rbacService.createRole(data, authHeader);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  async updateRole(
    @Param('id') id: string,
    @Body() data: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.rbacService.updateRole(id, data, authHeader);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  async deleteRole(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.rbacService.deleteRole(id, authHeader);
  }

  @Post('roles/:id/permissions')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully' })
  async assignRolePermissions(
    @Param('id') id: string,
    @Body() data: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.rbacService.assignRolePermissions(id, data, authHeader);
  }

  @Get('roles/:id/permissions')
  @ApiOperation({ summary: 'Get permissions for a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async getRolePermissions(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.rbacService.getRolePermissions(id, authHeader);
  }

  // ============ PERMISSIONS ============

  @Get('permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async getPermissions(@Headers('authorization') authHeader: string) {
    return this.rbacService.getPermissions(authHeader);
  }

  @Get('permissions/:id')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({ status: 200, description: 'Permission retrieved successfully' })
  async getPermission(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.rbacService.getPermission(id, authHeader);
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  async createPermission(
    @Body() data: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.rbacService.createPermission(data, authHeader);
  }

  @Post('permissions/check')
  @ApiOperation({ summary: 'Check if a user has a specific permission' })
  @ApiResponse({ status: 200, description: 'Permission check completed' })
  async checkPermission(@Body() data: Record<string, any>) {
    return this.rbacService.checkPermission(data);
  }

  // ============ RESOURCES ============

  @Get('resources')
  @ApiOperation({ summary: 'Get all resources' })
  @ApiResponse({ status: 200, description: 'Resources retrieved successfully' })
  async getResources(@Headers('authorization') authHeader: string) {
    return this.rbacService.getResources(authHeader);
  }

  @Post('resources')
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({ status: 201, description: 'Resource created successfully' })
  async createResource(
    @Body() data: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.rbacService.createResource(data, authHeader);
  }

  // ============ ACTIONS ============

  @Get('actions')
  @ApiOperation({ summary: 'Get all actions' })
  @ApiResponse({ status: 200, description: 'Actions retrieved successfully' })
  async getActions(@Headers('authorization') authHeader: string) {
    return this.rbacService.getActions(authHeader);
  }

  @Post('actions')
  @ApiOperation({ summary: 'Create a new action' })
  @ApiResponse({ status: 201, description: 'Action created successfully' })
  async createAction(
    @Body() data: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.rbacService.createAction(data, authHeader);
  }
}
