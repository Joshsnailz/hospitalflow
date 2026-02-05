import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  // ==================== Patient CRUD ====================

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or CHI number format' })
  @ApiResponse({ status: 409, description: 'Patient with this CHI number already exists' })
  async create(
    @Body() createPatientDto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.create(createPatientDto, authHeader);
  }

  @Get()
  @ApiOperation({ summary: 'Get all patients with pagination and filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'chiNumber', required: false })
  @ApiQuery({ name: 'gender', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'dateOfBirthFrom', required: false })
  @ApiQuery({ name: 'dateOfBirthTo', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Patients retrieved successfully' })
  async findAll(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.findAll(query, authHeader);
  }

  @Get('validate-chi/:chi')
  @ApiOperation({ summary: 'Validate CHI number format and check if it exists' })
  @ApiParam({ name: 'chi', description: 'CHI number to validate' })
  @ApiResponse({ status: 200, description: 'Validation result returned' })
  async validateChi(
    @Param('chi') chi: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.validateChi(chi, authHeader);
  }

  @Get('chi/:chi')
  @ApiOperation({ summary: 'Get patient by CHI number' })
  @ApiParam({ name: 'chi', description: 'Patient CHI number' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid CHI number format' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findByChiNumber(
    @Param('chi') chi: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.findByChiNumber(chi, authHeader);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findOne(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.findOne(id, authHeader);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePatientDto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.update(id, updatePatientDto, authHeader);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a patient (soft delete)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @ApiResponse({ status: 409, description: 'Patient is already deactivated' })
  async deactivate(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.deactivate(id, authHeader);
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient reactivated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @ApiResponse({ status: 409, description: 'Patient is already active' })
  async reactivate(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.reactivate(id, authHeader);
  }

  // ==================== Next of Kin ====================

  @Post(':id/next-of-kin')
  @ApiOperation({ summary: 'Add next of kin to patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 201, description: 'Next of kin added successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async addNextOfKin(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.addNextOfKin(id, dto, authHeader);
  }

  @Get(':id/next-of-kin')
  @ApiOperation({ summary: 'Get all next of kin for patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Next of kin retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findAllNextOfKin(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.findAllNextOfKin(id, authHeader);
  }

  @Patch(':id/next-of-kin/:nokId')
  @ApiOperation({ summary: 'Update next of kin' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'nokId', description: 'Next of kin UUID' })
  @ApiResponse({ status: 200, description: 'Next of kin updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient or next of kin not found' })
  async updateNextOfKin(
    @Param('id') id: string,
    @Param('nokId') nokId: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.updateNextOfKin(id, nokId, dto, authHeader);
  }

  @Delete(':id/next-of-kin/:nokId')
  @ApiOperation({ summary: 'Remove next of kin (soft delete)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'nokId', description: 'Next of kin UUID' })
  @ApiResponse({ status: 200, description: 'Next of kin removed successfully' })
  @ApiResponse({ status: 404, description: 'Patient or next of kin not found' })
  async removeNextOfKin(
    @Param('id') id: string,
    @Param('nokId') nokId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.removeNextOfKin(id, nokId, authHeader);
  }

  // ==================== Medical History ====================

  @Post(':id/medical-history')
  @ApiOperation({ summary: 'Add medical history to patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 201, description: 'Medical history added successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async addMedicalHistory(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.addMedicalHistory(id, dto, authHeader);
  }

  @Get(':id/medical-history')
  @ApiOperation({ summary: 'Get all medical history for patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Medical history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findAllMedicalHistory(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.findAllMedicalHistory(id, authHeader);
  }

  @Patch(':id/medical-history/:historyId')
  @ApiOperation({ summary: 'Update medical history' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'historyId', description: 'Medical history UUID' })
  @ApiResponse({ status: 200, description: 'Medical history updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient or medical history not found' })
  async updateMedicalHistory(
    @Param('id') id: string,
    @Param('historyId') historyId: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.updateMedicalHistory(id, historyId, dto, authHeader);
  }

  @Delete(':id/medical-history/:historyId')
  @ApiOperation({ summary: 'Remove medical history (soft delete)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'historyId', description: 'Medical history UUID' })
  @ApiResponse({ status: 200, description: 'Medical history removed successfully' })
  @ApiResponse({ status: 404, description: 'Patient or medical history not found' })
  async removeMedicalHistory(
    @Param('id') id: string,
    @Param('historyId') historyId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.removeMedicalHistory(id, historyId, authHeader);
  }

  // ==================== Allergies ====================

  @Post(':id/allergies')
  @ApiOperation({ summary: 'Add allergy to patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 201, description: 'Allergy added successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async addAllergy(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.addAllergy(id, dto, authHeader);
  }

  @Get(':id/allergies')
  @ApiOperation({ summary: 'Get all allergies for patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Allergies retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findAllAllergies(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.findAllAllergies(id, authHeader);
  }

  @Patch(':id/allergies/:allergyId')
  @ApiOperation({ summary: 'Update allergy' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'allergyId', description: 'Allergy UUID' })
  @ApiResponse({ status: 200, description: 'Allergy updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient or allergy not found' })
  async updateAllergy(
    @Param('id') id: string,
    @Param('allergyId') allergyId: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.updateAllergy(id, allergyId, dto, authHeader);
  }

  @Delete(':id/allergies/:allergyId')
  @ApiOperation({ summary: 'Remove allergy (soft delete)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'allergyId', description: 'Allergy UUID' })
  @ApiResponse({ status: 200, description: 'Allergy removed successfully' })
  @ApiResponse({ status: 404, description: 'Patient or allergy not found' })
  async removeAllergy(
    @Param('id') id: string,
    @Param('allergyId') allergyId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.removeAllergy(id, allergyId, authHeader);
  }

  // ==================== Medical Aid ====================

  @Post(':id/medical-aid')
  @ApiOperation({ summary: 'Add medical aid to patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 201, description: 'Medical aid added successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async addMedicalAid(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.addMedicalAid(id, dto, authHeader);
  }

  @Get(':id/medical-aid')
  @ApiOperation({ summary: 'Get all medical aid for patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Medical aid retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findAllMedicalAid(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.findAllMedicalAid(id, authHeader);
  }

  @Patch(':id/medical-aid/:medicalAidId')
  @ApiOperation({ summary: 'Update medical aid' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'medicalAidId', description: 'Medical aid UUID' })
  @ApiResponse({ status: 200, description: 'Medical aid updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient or medical aid not found' })
  async updateMedicalAid(
    @Param('id') id: string,
    @Param('medicalAidId') medicalAidId: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.updateMedicalAid(id, medicalAidId, dto, authHeader);
  }

  @Delete(':id/medical-aid/:medicalAidId')
  @ApiOperation({ summary: 'Remove medical aid (soft delete)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'medicalAidId', description: 'Medical aid UUID' })
  @ApiResponse({ status: 200, description: 'Medical aid removed successfully' })
  @ApiResponse({ status: 404, description: 'Patient or medical aid not found' })
  async removeMedicalAid(
    @Param('id') id: string,
    @Param('medicalAidId') medicalAidId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.patientsService.removeMedicalAid(id, medicalAidId, authHeader);
  }
}
