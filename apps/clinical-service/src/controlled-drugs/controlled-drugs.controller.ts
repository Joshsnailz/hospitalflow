import {
  Controller,
  Get,
  Post,
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
import { ControlledDrugsService } from './controlled-drugs.service';
import {
  CreateControlledDrugEntryDto,
  ControlledDrugFilterDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { CLINICAL_ACCESS_ROLES } from '../config/roles.config';

@ApiTags('controlled-drugs')
@ApiBearerAuth('JWT-auth')
@Controller('controlled-drugs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ControlledDrugsController {
  constructor(private readonly controlledDrugsService: ControlledDrugsService) {}

  @Post()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Register a controlled drug entry' })
  @ApiResponse({ status: 201, description: 'Controlled drug entry registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() dto: CreateControlledDrugEntryDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const entry = await this.controlledDrugsService.create(dto, currentUserId);
    return {
      success: true,
      message: 'Controlled drug entry registered successfully',
      data: entry,
    };
  }

  @Get()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all controlled drug entries with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Controlled drug entries retrieved successfully' })
  async findAll(@Query() filterDto: ControlledDrugFilterDto) {
    const result = await this.controlledDrugsService.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('dashboard/stats')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get controlled drugs dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats() {
    const stats = await this.controlledDrugsService.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('patient/:patientId')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all controlled drug entries for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Controlled drug entries retrieved successfully' })
  async findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    const entries = await this.controlledDrugsService.findByPatient(patientId);
    return {
      success: true,
      data: entries,
    };
  }

  @Get(':id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get controlled drug entry by ID' })
  @ApiParam({ name: 'id', description: 'Controlled drug entry UUID' })
  @ApiResponse({ status: 200, description: 'Controlled drug entry retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Controlled drug entry not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const entry = await this.controlledDrugsService.findOne(id);
    return {
      success: true,
      data: entry,
    };
  }
}
