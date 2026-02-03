import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import {
  CreateAuditLogDto,
  CreateDataAccessLogDto,
  QueryAuditLogDto,
  QueryDataAccessLogDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Public } from '../auth/decorators';
import { ROLES } from '../config/roles.config';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('logs')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an audit log entry' })
  @ApiResponse({ status: 201, description: 'Audit log created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createLog(@Body() dto: CreateAuditLogDto) {
    const log = await this.auditService.create(dto);
    return {
      success: true,
      message: 'Audit log created successfully',
      data: log,
    };
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Query audit logs with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async queryLogs(@Query() query: QueryAuditLogDto) {
    const result = await this.auditService.queryLogs(query);
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('logs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific audit log by ID' })
  @ApiParam({ name: 'id', description: 'Audit log UUID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getLogById(@Param('id', ParseUUIDPipe) id: string) {
    const log = await this.auditService.findLogById(id);
    return {
      success: true,
      data: log,
    };
  }

  @Post('data-access')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a PHI data access log entry (HIPAA tracking)' })
  @ApiResponse({ status: 201, description: 'Data access log created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createDataAccessLog(@Body() dto: CreateDataAccessLogDto) {
    const log = await this.auditService.createDataAccessLog(dto);
    return {
      success: true,
      message: 'Data access log created successfully',
      data: log,
    };
  }

  @Get('data-access')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Query PHI data access logs with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Data access logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async queryDataAccessLogs(@Query() query: QueryDataAccessLogDto) {
    const result = await this.auditService.queryDataAccessLogs(query);
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('data-access/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific data access log by ID' })
  @ApiParam({ name: 'id', description: 'Data access log UUID' })
  @ApiResponse({ status: 200, description: 'Data access log retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Data access log not found' })
  async getDataAccessLogById(@Param('id', ParseUUIDPipe) id: string) {
    const log = await this.auditService.findDataAccessLogById(id);
    return {
      success: true,
      data: log,
    };
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all audit activity for a specific user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getUserActivity(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: QueryAuditLogDto,
  ) {
    const result = await this.auditService.queryLogs({ ...query, userId });
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('patient/:patientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all data access logs for a specific patient (HIPAA compliance)' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient data access logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getPatientAccessLogs(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: QueryDataAccessLogDto,
  ) {
    const result = await this.auditService.queryDataAccessLogs({ ...query, patientId });
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit statistics for dashboard' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.auditService.getStatistics(startDate, endDate);
    return {
      success: true,
      data: stats,
    };
  }
}
