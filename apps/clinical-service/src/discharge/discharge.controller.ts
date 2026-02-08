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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DischargeService } from './discharge.service';
import {
  CreateDischargeFormDto,
  UpdateClinicalSectionDto,
  UpdatePharmacySectionDto,
  UpdateOperationsSectionDto,
  UpdateNursingSectionDto,
  UpdateFollowUpSectionDto,
  UpdateVitalsDto,
  CompleteDischargeDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { CLINICAL_ACCESS_ROLES } from '../config/roles.config';

@ApiTags('discharge')
@ApiBearerAuth('JWT-auth')
@Controller('discharge')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DischargeController {
  constructor(private readonly dischargeService: DischargeService) {}

  @Post()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Create a discharge form' })
  @ApiResponse({ status: 201, description: 'Discharge form created successfully' })
  @ApiResponse({ status: 409, description: 'Discharge form already exists for this encounter' })
  async create(
    @Body() dto: CreateDischargeFormDto & { encounterId?: string },
    @CurrentUser('id') currentUserId: string,
  ) {
    const form = await this.dischargeService.create(dto.encounterId || null, dto, currentUserId);
    return {
      success: true,
      message: 'Discharge form created successfully',
      data: form,
    };
  }

  @Get()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all discharge forms with optional status filter' })
  @ApiResponse({ status: 200, description: 'Discharge forms retrieved successfully' })
  async findAll(@Query('status') status?: string) {
    const forms = await this.dischargeService.findAll(status ? { status } : undefined);
    return {
      success: true,
      data: forms,
    };
  }

  @Get('dashboard/stats')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get discharge dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats(@CurrentUser('role') role: string) {
    const stats = await this.dischargeService.getDashboardStats(role);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('active')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all active discharge forms' })
  @ApiResponse({ status: 200, description: 'Active discharge forms retrieved successfully' })
  async findActive() {
    const forms = await this.dischargeService.findActive();
    return {
      success: true,
      data: forms,
    };
  }

  @Get('encounter/:encounterId')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get discharge form by encounter ID' })
  @ApiParam({ name: 'encounterId', description: 'Encounter UUID' })
  @ApiResponse({ status: 200, description: 'Discharge form retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Discharge form not found' })
  async findByEncounter(@Param('encounterId', ParseUUIDPipe) encounterId: string) {
    const form = await this.dischargeService.findByEncounter(encounterId);
    return {
      success: true,
      data: form,
    };
  }

  @Get('patient/:patientId')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all discharge forms for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Discharge forms retrieved successfully' })
  async findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    const forms = await this.dischargeService.findByPatient(patientId);
    return {
      success: true,
      data: forms,
    };
  }

  @Get(':id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get discharge form by ID' })
  @ApiParam({ name: 'id', description: 'Discharge form UUID' })
  @ApiResponse({ status: 200, description: 'Discharge form retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Discharge form not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const form = await this.dischargeService.findOne(id);
    return {
      success: true,
      data: form,
    };
  }

  @Patch(':id/section')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update a section of the discharge form (generic endpoint)' })
  @ApiParam({ name: 'id', description: 'Discharge form UUID' })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid section name' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  async updateSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { section: string; content: Record<string, any>; version: number },
    @CurrentUser('id') currentUserId: string,
  ) {
    const { section, content, version } = body;
    if (!section) {
      throw new BadRequestException('Section name is required');
    }
    const form = await this.dischargeService.updateSection(id, section, content || {}, version || 1, currentUserId);
    return {
      success: true,
      message: `${section} section updated successfully`,
      data: form,
    };
  }

  @Patch(':id/clinical')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update clinical section of discharge form' })
  @ApiParam({ name: 'id', description: 'Discharge form UUID' })
  @ApiResponse({ status: 200, description: 'Clinical section updated successfully' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  async updateClinicalSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClinicalSectionDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const form = await this.dischargeService.updateClinicalSection(id, dto, currentUserId);
    return {
      success: true,
      message: 'Clinical section updated successfully',
      data: form,
    };
  }

  @Patch(':id/pharmacy')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update pharmacy section of discharge form' })
  @ApiParam({ name: 'id', description: 'Discharge form UUID' })
  @ApiResponse({ status: 200, description: 'Pharmacy section updated successfully' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  async updatePharmacySection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePharmacySectionDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const form = await this.dischargeService.updatePharmacySection(id, dto, currentUserId);
    return {
      success: true,
      message: 'Pharmacy section updated successfully',
      data: form,
    };
  }

  @Patch(':id/operations')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update operations section of discharge form' })
  @ApiParam({ name: 'id', description: 'Discharge form UUID' })
  @ApiResponse({ status: 200, description: 'Operations section updated successfully' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  async updateOperationsSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOperationsSectionDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const form = await this.dischargeService.updateOperationsSection(id, dto, currentUserId);
    return {
      success: true,
      message: 'Operations section updated successfully',
      data: form,
    };
  }

  @Patch(':id/nursing')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update nursing section of discharge form' })
  @ApiParam({ name: 'id', description: 'Discharge form UUID' })
  @ApiResponse({ status: 200, description: 'Nursing section updated successfully' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  async updateNursingSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNursingSectionDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const form = await this.dischargeService.updateNursingSection(id, dto, currentUserId);
    return {
      success: true,
      message: 'Nursing section updated successfully',
      data: form,
    };
  }

  @Patch(':id/followup')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update follow-up section of discharge form' })
  @ApiParam({ name: 'id', description: 'Discharge form UUID' })
  @ApiResponse({ status: 200, description: 'Follow-up section updated successfully' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  async updateFollowUpSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFollowUpSectionDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const form = await this.dischargeService.updateFollowUpSection(id, dto, currentUserId);
    return {
      success: true,
      message: 'Follow-up section updated successfully',
      data: form,
    };
  }

  @Patch(':id/vitals')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update vitals of discharge form' })
  @ApiParam({ name: 'id', description: 'Discharge form UUID' })
  @ApiResponse({ status: 200, description: 'Vitals updated successfully' })
  async updateVitals(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVitalsDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const form = await this.dischargeService.updateVitals(id, dto, currentUserId);
    return {
      success: true,
      message: 'Vitals updated successfully',
      data: form,
    };
  }

  @Post(':id/complete')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete discharge' })
  @ApiParam({ name: 'id', description: 'Discharge form UUID' })
  @ApiResponse({ status: 200, description: 'Discharge completed successfully' })
  @ApiResponse({ status: 400, description: 'Form is not active' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteDischargeDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const form = await this.dischargeService.complete(id, dto, currentUserId);
    return {
      success: true,
      message: 'Discharge completed successfully',
      data: form,
    };
  }
}
