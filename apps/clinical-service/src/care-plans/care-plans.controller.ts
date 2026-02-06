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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CarePlansService } from './care-plans.service';
import {
  CreateCarePlanDto,
  UpdateCarePlanDto,
  CarePlanFilterDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { CLINICAL_ACCESS_ROLES } from '../config/roles.config';

@ApiTags('care-plans')
@ApiBearerAuth('JWT-auth')
@Controller('care-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarePlansController {
  constructor(private readonly carePlansService: CarePlansService) {}

  @Post()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Create a new care plan' })
  @ApiResponse({ status: 201, description: 'Care plan created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() dto: CreateCarePlanDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const carePlan = await this.carePlansService.create(dto, currentUserId);
    return {
      success: true,
      message: 'Care plan created successfully',
      data: carePlan,
    };
  }

  @Get()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all care plans with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Care plans retrieved successfully' })
  async findAll(@Query() filterDto: CarePlanFilterDto) {
    const result = await this.carePlansService.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('dashboard/stats')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get care plans dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats() {
    const stats = await this.carePlansService.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('active')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all active care plans' })
  @ApiResponse({ status: 200, description: 'Active care plans retrieved successfully' })
  async findActive() {
    const plans = await this.carePlansService.findActive();
    return {
      success: true,
      data: plans,
    };
  }

  @Get('patient/:patientId')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all care plans for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Care plans retrieved successfully' })
  async findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    const plans = await this.carePlansService.findByPatient(patientId);
    return {
      success: true,
      data: plans,
    };
  }

  @Get(':id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get care plan by ID' })
  @ApiParam({ name: 'id', description: 'Care plan UUID' })
  @ApiResponse({ status: 200, description: 'Care plan retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Care plan not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const plan = await this.carePlansService.findOne(id);
    return {
      success: true,
      data: plan,
    };
  }

  @Patch(':id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update care plan' })
  @ApiParam({ name: 'id', description: 'Care plan UUID' })
  @ApiResponse({ status: 200, description: 'Care plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Care plan not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCarePlanDto,
  ) {
    const plan = await this.carePlansService.update(id, dto);
    return {
      success: true,
      message: 'Care plan updated successfully',
      data: plan,
    };
  }
}
