import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 409, description: 'Role already exists' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolesService.create(createRoleDto);
    return {
      success: true,
      message: 'Role created successfully',
      data: role,
    };
  }

  @Get()
  @Roles('clinical_admin')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async findAll() {
    const roles = await this.rolesService.findAll();
    return {
      success: true,
      data: roles,
    };
  }

  @Get(':id')
  @Roles('clinical_admin')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const role = await this.rolesService.findOne(id);
    return {
      success: true,
      data: role,
    };
  }

  @Patch(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const role = await this.rolesService.update(id, updateRoleDto);
    return {
      success: true,
      message: 'Role updated successfully',
      data: role,
    };
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 403, description: 'Cannot delete system roles' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.rolesService.remove(id);
    return {
      success: true,
      message: 'Role deleted successfully',
    };
  }

  @Post(':id/permissions')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully' })
  @ApiResponse({ status: 404, description: 'Role or permissions not found' })
  async assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
    @CurrentUser('id') userId: string,
  ) {
    const role = await this.rolesService.assignPermissions(
      id,
      assignPermissionsDto,
      userId,
    );
    return {
      success: true,
      message: 'Permissions assigned successfully',
      data: role,
    };
  }

  @Get(':id/permissions')
  @Roles('clinical_admin')
  @ApiOperation({ summary: 'Get permissions for a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRolePermissions(@Param('id', ParseUUIDPipe) id: string) {
    const permissions = await this.rolesService.getRolePermissions(id);
    return {
      success: true,
      data: permissions,
    };
  }
}
