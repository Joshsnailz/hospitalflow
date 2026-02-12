import {
  Controller,
  Get,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { CLINICAL_ACCESS_ROLES } from '../config/roles.config';

@ApiTags('dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('clinical/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get aggregated clinical dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getStats(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Headers('authorization') authHeader: string,
    @Query('userId') queryUserId?: string,
    @Query('role') queryRole?: string,
  ) {
    const effectiveUserId = queryUserId || userId;
    const effectiveRole = queryRole || role;

    const stats = await this.dashboardService.getAggregatedStats(effectiveUserId, effectiveRole, authHeader);
    return {
      success: true,
      data: stats,
    };
  }
}
