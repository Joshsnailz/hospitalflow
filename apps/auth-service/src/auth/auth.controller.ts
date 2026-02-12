import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService, AuthResponse, AuthTokens } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, CreateUserAdminDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './strategies/jwt.strategy';

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number', example: 900 },
              },
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<{ success: boolean; data: AuthResponse }> {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('register')
  @Roles('super_admin', 'clinical_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register new user (Admin only)' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ success: boolean; data: { id: string; email: string } }> {
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ success: boolean; data: AuthTokens }> {
    const tokens = await this.authService.refreshToken(refreshTokenDto);
    return {
      success: true,
      data: tokens,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser('sub') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.authService.logout(userId);
    return {
      success: true,
      message: 'Logout successful',
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'Current user info' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: JwtPayload) {
    const userInfo = await this.authService.getMe(user.sub);
    return {
      success: true,
      data: userInfo,
    };
  }

  @Get('clinicians')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active clinicians (accessible to all authenticated users)' })
  @ApiResponse({ status: 200, description: 'Clinicians retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getClinicians() {
    const clinicians = await this.authService.findClinicians();
    return {
      success: true,
      data: clinicians,
    };
  }

  // Admin User Management Endpoints

  @Post('admin/users')
  @Roles('super_admin', 'clinical_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new user (Admin only) - auto-generates password' })
  @ApiBody({ type: CreateUserAdminDto })
  @ApiResponse({ status: 201, description: 'User created successfully with temporary password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async createUserAdmin(@Body() createUserDto: CreateUserAdminDto) {
    const result = await this.authService.createUserAdmin(createUserDto);
    return {
      success: true,
      message: 'User created successfully',
      data: {
        ...result.user,
        temporaryPassword: result.temporaryPassword,
      },
    };
  }

  @Get('admin/users')
  @Roles('super_admin', 'clinical_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.authService.findAllUsers({
      search,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return {
      success: true,
      ...result,
    };
  }

  @Post('admin/users/:id/activate')
  @Roles('super_admin', 'clinical_admin')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async activateUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.authService.activateUser(id);
    return {
      success: true,
      message: 'User activated successfully',
    };
  }

  @Post('admin/users/:id/deactivate')
  @Roles('super_admin', 'clinical_admin')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async deactivateUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.authService.deactivateUser(id);
    return {
      success: true,
      message: 'User deactivated successfully',
    };
  }
}
