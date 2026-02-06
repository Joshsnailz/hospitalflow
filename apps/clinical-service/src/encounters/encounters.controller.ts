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
import { EncountersService } from './encounters.service';
import {
  CreateEncounterDto,
  UpdateEncounterDto,
  CreateClinicalNoteDto,
  EncounterFilterDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { CLINICAL_ACCESS_ROLES } from '../config/roles.config';

@ApiTags('encounters')
@ApiBearerAuth('JWT-auth')
@Controller('encounters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Post()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Create a new encounter' })
  @ApiResponse({ status: 201, description: 'Encounter created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() dto: CreateEncounterDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const encounter = await this.encountersService.create(dto, currentUserId);
    return {
      success: true,
      message: 'Encounter created successfully',
      data: encounter,
    };
  }

  @Get()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all encounters with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Encounters retrieved successfully' })
  async findAll(@Query() filterDto: EncounterFilterDto) {
    const result = await this.encountersService.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('dashboard/stats')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get encounter dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const stats = await this.encountersService.getDashboardStats(userId, role);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('patient/:patientId')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all encounters for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Encounters retrieved successfully' })
  async findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    const encounters = await this.encountersService.findByPatient(patientId);
    return {
      success: true,
      data: encounters,
    };
  }

  @Get('doctor/:doctorId')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get encounters for a doctor' })
  @ApiParam({ name: 'doctorId', description: 'Doctor UUID' })
  @ApiResponse({ status: 200, description: 'Encounters retrieved successfully' })
  async findByDoctor(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('status') status?: string,
  ) {
    const encounters = await this.encountersService.findByDoctor(doctorId, status);
    return {
      success: true,
      data: encounters,
    };
  }

  @Post(':id/assign-bed')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a bed to an encounter' })
  @ApiParam({ name: 'id', description: 'Encounter UUID' })
  @ApiResponse({ status: 200, description: 'Bed assigned successfully' })
  async assignBed(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('wardId') wardId: string,
    @Body('bedId') bedId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    const encounter = await this.encountersService.assignBed(id, wardId, bedId, currentUserId);
    return {
      success: true,
      message: 'Bed assigned successfully',
      data: encounter,
    };
  }

  @Get('ward/:wardId')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get encounters by ward' })
  @ApiParam({ name: 'wardId', description: 'Ward UUID' })
  @ApiResponse({ status: 200, description: 'Encounters retrieved successfully' })
  async findByWard(@Param('wardId', ParseUUIDPipe) wardId: string) {
    const encounters = await this.encountersService.findByWard(wardId);
    return {
      success: true,
      data: encounters,
    };
  }

  @Get(':id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get encounter by ID' })
  @ApiParam({ name: 'id', description: 'Encounter UUID' })
  @ApiResponse({ status: 200, description: 'Encounter retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Encounter not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const encounter = await this.encountersService.findOne(id);
    return {
      success: true,
      data: encounter,
    };
  }

  @Patch(':id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update encounter' })
  @ApiParam({ name: 'id', description: 'Encounter UUID' })
  @ApiResponse({ status: 200, description: 'Encounter updated successfully' })
  @ApiResponse({ status: 404, description: 'Encounter not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEncounterDto,
  ) {
    const encounter = await this.encountersService.update(id, dto);
    return {
      success: true,
      message: 'Encounter updated successfully',
      data: encounter,
    };
  }

  @Post(':id/notes')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Add clinical note to encounter' })
  @ApiParam({ name: 'id', description: 'Encounter UUID' })
  @ApiResponse({ status: 201, description: 'Clinical note added successfully' })
  @ApiResponse({ status: 404, description: 'Encounter not found' })
  async addClinicalNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateClinicalNoteDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const note = await this.encountersService.addClinicalNote(id, dto, currentUserId);
    return {
      success: true,
      message: 'Clinical note added successfully',
      data: note,
    };
  }

  @Get(':id/notes')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get clinical notes for encounter' })
  @ApiParam({ name: 'id', description: 'Encounter UUID' })
  @ApiResponse({ status: 200, description: 'Clinical notes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Encounter not found' })
  async getClinicalNotes(@Param('id', ParseUUIDPipe) id: string) {
    const notes = await this.encountersService.getClinicalNotes(id);
    return {
      success: true,
      data: notes,
    };
  }
}
