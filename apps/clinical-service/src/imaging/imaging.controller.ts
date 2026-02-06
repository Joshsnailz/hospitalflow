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
import { ImagingService } from './imaging.service';
import {
  CreateImagingRequestDto,
  UpdateImagingRequestDto,
  ImagingFilterDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { CLINICAL_ACCESS_ROLES } from '../config/roles.config';

@ApiTags('imaging')
@ApiBearerAuth('JWT-auth')
@Controller('imaging')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImagingController {
  constructor(private readonly imagingService: ImagingService) {}

  @Post()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Create a new imaging request' })
  @ApiResponse({ status: 201, description: 'Imaging request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() dto: CreateImagingRequestDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const request = await this.imagingService.create(dto, currentUserId);
    return {
      success: true,
      message: 'Imaging request created successfully',
      data: request,
    };
  }

  @Get()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all imaging requests with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Imaging requests retrieved successfully' })
  async findAll(@Query() filterDto: ImagingFilterDto) {
    const result = await this.imagingService.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('dashboard/stats')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get imaging dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats() {
    const stats = await this.imagingService.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('patient/:patientId')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all imaging requests for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Imaging requests retrieved successfully' })
  async findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    const requests = await this.imagingService.findByPatient(patientId);
    return {
      success: true,
      data: requests,
    };
  }

  @Get(':id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get imaging request by ID' })
  @ApiParam({ name: 'id', description: 'Imaging request UUID' })
  @ApiResponse({ status: 200, description: 'Imaging request retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Imaging request not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const request = await this.imagingService.findOne(id);
    return {
      success: true,
      data: request,
    };
  }

  @Patch(':id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update imaging request' })
  @ApiParam({ name: 'id', description: 'Imaging request UUID' })
  @ApiResponse({ status: 200, description: 'Imaging request updated successfully' })
  @ApiResponse({ status: 404, description: 'Imaging request not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateImagingRequestDto,
  ) {
    const request = await this.imagingService.update(id, dto);
    return {
      success: true,
      message: 'Imaging request updated successfully',
      data: request,
    };
  }
}
