import {
  Controller,
  Get,
  Post,
  Patch,
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
import { EmergencyService } from './emergency.service';
import {
  CreateEmergencyVisitDto,
  UpdateEmergencyVisitDto,
  EmergencyFilterDto,
  DisposeEmergencyVisitDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { CLINICAL_ACCESS_ROLES } from '../config/roles.config';

@ApiTags('emergency')
@ApiBearerAuth('JWT-auth')
@Controller('emergency')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Register a new emergency visit' })
  @ApiResponse({ status: 201, description: 'Emergency visit registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreateEmergencyVisitDto) {
    const visit = await this.emergencyService.create(dto);
    return {
      success: true,
      message: 'Emergency visit registered successfully',
      data: visit,
    };
  }

  @Get()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all emergency visits with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Emergency visits retrieved successfully' })
  async findAll(@Query() filterDto: EmergencyFilterDto) {
    const result = await this.emergencyService.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('dashboard/stats')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get emergency dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats() {
    const stats = await this.emergencyService.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('active')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all active emergency visits' })
  @ApiResponse({ status: 200, description: 'Active emergency visits retrieved successfully' })
  async findActive() {
    const visits = await this.emergencyService.findActive();
    return {
      success: true,
      data: visits,
    };
  }

  @Get('patient/:patientId')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all emergency visits for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Emergency visits retrieved successfully' })
  async findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    const visits = await this.emergencyService.findByPatient(patientId);
    return {
      success: true,
      data: visits,
    };
  }

  @Post(':id/dispose')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispose emergency visit (admit, discharge, transfer, etc.)' })
  @ApiParam({ name: 'id', description: 'Emergency visit UUID' })
  @ApiResponse({ status: 200, description: 'Emergency visit disposed successfully' })
  async dispose(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisposeEmergencyVisitDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const result = await this.emergencyService.dispose(id, dto, currentUserId);
    return {
      success: true,
      message: 'Emergency visit disposed successfully',
      data: result,
    };
  }

  @Get(':id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get emergency visit by ID' })
  @ApiParam({ name: 'id', description: 'Emergency visit UUID' })
  @ApiResponse({ status: 200, description: 'Emergency visit retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Emergency visit not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const visit = await this.emergencyService.findOne(id);
    return {
      success: true,
      data: visit,
    };
  }

  @Patch(':id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update emergency visit' })
  @ApiParam({ name: 'id', description: 'Emergency visit UUID' })
  @ApiResponse({ status: 200, description: 'Emergency visit updated successfully' })
  @ApiResponse({ status: 404, description: 'Emergency visit not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmergencyVisitDto,
  ) {
    const visit = await this.emergencyService.update(id, dto);
    return {
      success: true,
      message: 'Emergency visit updated successfully',
      data: visit,
    };
  }
}
