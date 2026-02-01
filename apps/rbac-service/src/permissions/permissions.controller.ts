import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, CheckPermissionDto, GrantUserPermissionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser, Public } from '../auth/decorators';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  @ApiResponse({ status: 409, description: 'Permission already exists' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const permission = await this.permissionsService.create(createPermissionDto);
    return {
      success: true,
      message: 'Permission created successfully',
      data: permission,
    };
  }

  @Get()
  @Roles('clinical_admin')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async findAll() {
    const permissions = await this.permissionsService.findAll();
    return {
      success: true,
      data: permissions,
    };
  }

  @Get(':id')
  @Roles('clinical_admin')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({ status: 200, description: 'Permission retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const permission = await this.permissionsService.findOne(id);
    return {
      success: true,
      data: permission,
    };
  }

  @Post('check')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if a user has a specific permission' })
  @ApiResponse({ status: 200, description: 'Permission check completed' })
  async checkPermission(@Body() checkDto: CheckPermissionDto) {
    const result = await this.permissionsService.checkPermission(checkDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('users/:userId')
  @Roles('clinical_admin')
  @ApiOperation({ summary: 'Get all permissions for a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User permissions retrieved successfully' })
  async getUserPermissions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: { userRole: string },
  ) {
    const permissions = await this.permissionsService.getUserPermissions(
      userId,
      body.userRole,
    );
    return {
      success: true,
      data: permissions,
    };
  }

  @Post('users/:userId')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Grant or deny a permission to a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 201, description: 'User permission granted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async grantUserPermission(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() grantDto: GrantUserPermissionDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const userPermission = await this.permissionsService.grantUserPermission(
      userId,
      grantDto,
      currentUserId,
    );
    return {
      success: true,
      message: 'User permission updated successfully',
      data: userPermission,
    };
  }

  @Delete('users/:userId/:permissionId')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a permission from a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiParam({ name: 'permissionId', description: 'Permission UUID' })
  @ApiResponse({ status: 200, description: 'User permission revoked successfully' })
  @ApiResponse({ status: 404, description: 'User permission not found' })
  async revokeUserPermission(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    await this.permissionsService.revokeUserPermission(userId, permissionId);
    return {
      success: true,
      message: 'User permission revoked successfully',
    };
  }
}
