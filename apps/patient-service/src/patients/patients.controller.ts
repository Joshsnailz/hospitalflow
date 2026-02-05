import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { PatientsService } from './patients.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  PatientFilterDto,
  CreateNextOfKinDto,
  UpdateNextOfKinDto,
  CreateMedicalHistoryDto,
  UpdateMedicalHistoryDto,
  CreateAllergyDto,
  UpdateAllergyDto,
  CreateMedicalAidDto,
  UpdateMedicalAidDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser, Public } from '../auth/decorators';
import { ROLES, PATIENT_ACCESS_ROLES } from '../config/roles.config';
import { ParseChiPipe } from '../common/pipes/parse-chi.pipe';

@ApiTags('patients')
@ApiBearerAuth('JWT-auth')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  // ==================== Patient CRUD ====================

  @Post()
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or CHI number format' })
  @ApiResponse({ status: 409, description: 'Patient with this CHI number already exists' })
  async create(
    @Body() createPatientDto: CreatePatientDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const patient = await this.patientsService.create(createPatientDto, currentUserId);
    return {
      success: true,
      message: 'Patient created successfully',
      data: patient,
    };
  }

  @Get()
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all patients with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Patients retrieved successfully' })
  async findAll(@Query() filterDto: PatientFilterDto) {
    const result = await this.patientsService.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('validate-chi/:chi')
  @Public()
  @ApiOperation({ summary: 'Validate CHI number format and check if it exists' })
  @ApiParam({ name: 'chi', description: 'CHI number to validate' })
  @ApiResponse({ status: 200, description: 'Validation result returned' })
  async validateChi(@Param('chi') chi: string) {
    const result = await this.patientsService.validateChiFormat(chi);
    return {
      success: true,
      data: result,
    };
  }

  @Get('chi/:chi')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get patient by CHI number' })
  @ApiParam({ name: 'chi', description: 'Patient CHI number' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid CHI number format' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findByChiNumber(@Param('chi', ParseChiPipe) chi: string) {
    const patient = await this.patientsService.findByChiNumber(chi);
    return {
      success: true,
      data: patient,
    };
  }

  @Get(':id')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const patient = await this.patientsService.findOne(id);
    return {
      success: true,
      data: patient,
    };
  }

  @Patch(':id')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const patient = await this.patientsService.update(id, updatePatientDto, currentUserId);
    return {
      success: true,
      message: 'Patient updated successfully',
      data: patient,
    };
  }

  @Post(':id/deactivate')
  @Roles(ROLES.CLINICAL_ADMIN, ROLES.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a patient (soft delete)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @ApiResponse({ status: 409, description: 'Patient is already deactivated' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    const patient = await this.patientsService.deactivate(id, currentUserId);
    return {
      success: true,
      message: 'Patient deactivated successfully',
      data: patient,
    };
  }

  @Post(':id/reactivate')
  @Roles(ROLES.CLINICAL_ADMIN, ROLES.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient reactivated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @ApiResponse({ status: 409, description: 'Patient is already active' })
  async reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    const patient = await this.patientsService.reactivate(id, currentUserId);
    return {
      success: true,
      message: 'Patient reactivated successfully',
      data: patient,
    };
  }

  // ==================== Next of Kin ====================

  @Post(':id/next-of-kin')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Add next of kin to patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 201, description: 'Next of kin added successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async addNextOfKin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateNextOfKinDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const nextOfKin = await this.patientsService.addNextOfKin(id, createDto, currentUserId);
    return {
      success: true,
      message: 'Next of kin added successfully',
      data: nextOfKin,
    };
  }

  @Get(':id/next-of-kin')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all next of kin for patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Next of kin retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findAllNextOfKin(@Param('id', ParseUUIDPipe) id: string) {
    const nextOfKin = await this.patientsService.findAllNextOfKin(id);
    return {
      success: true,
      data: nextOfKin,
    };
  }

  @Patch(':id/next-of-kin/:nokId')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update next of kin' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'nokId', description: 'Next of kin UUID' })
  @ApiResponse({ status: 200, description: 'Next of kin updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient or next of kin not found' })
  async updateNextOfKin(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('nokId', ParseUUIDPipe) nokId: string,
    @Body() updateDto: UpdateNextOfKinDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const nextOfKin = await this.patientsService.updateNextOfKin(id, nokId, updateDto, currentUserId);
    return {
      success: true,
      message: 'Next of kin updated successfully',
      data: nextOfKin,
    };
  }

  @Delete(':id/next-of-kin/:nokId')
  @Roles(...PATIENT_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove next of kin (soft delete)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'nokId', description: 'Next of kin UUID' })
  @ApiResponse({ status: 200, description: 'Next of kin removed successfully' })
  @ApiResponse({ status: 404, description: 'Patient or next of kin not found' })
  async removeNextOfKin(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('nokId', ParseUUIDPipe) nokId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.patientsService.removeNextOfKin(id, nokId, currentUserId);
    return {
      success: true,
      message: 'Next of kin removed successfully',
    };
  }

  // ==================== Medical History ====================

  @Post(':id/medical-history')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Add medical history to patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 201, description: 'Medical history added successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async addMedicalHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateMedicalHistoryDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const medicalHistory = await this.patientsService.addMedicalHistory(id, createDto, currentUserId);
    return {
      success: true,
      message: 'Medical history added successfully',
      data: medicalHistory,
    };
  }

  @Get(':id/medical-history')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all medical history for patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Medical history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findAllMedicalHistory(@Param('id', ParseUUIDPipe) id: string) {
    const medicalHistory = await this.patientsService.findAllMedicalHistory(id);
    return {
      success: true,
      data: medicalHistory,
    };
  }

  @Patch(':id/medical-history/:historyId')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update medical history' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'historyId', description: 'Medical history UUID' })
  @ApiResponse({ status: 200, description: 'Medical history updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient or medical history not found' })
  async updateMedicalHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('historyId', ParseUUIDPipe) historyId: string,
    @Body() updateDto: UpdateMedicalHistoryDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const medicalHistory = await this.patientsService.updateMedicalHistory(
      id,
      historyId,
      updateDto,
      currentUserId,
    );
    return {
      success: true,
      message: 'Medical history updated successfully',
      data: medicalHistory,
    };
  }

  @Delete(':id/medical-history/:historyId')
  @Roles(...PATIENT_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove medical history (soft delete)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'historyId', description: 'Medical history UUID' })
  @ApiResponse({ status: 200, description: 'Medical history removed successfully' })
  @ApiResponse({ status: 404, description: 'Patient or medical history not found' })
  async removeMedicalHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('historyId', ParseUUIDPipe) historyId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.patientsService.removeMedicalHistory(id, historyId, currentUserId);
    return {
      success: true,
      message: 'Medical history removed successfully',
    };
  }

  // ==================== Allergies ====================

  @Post(':id/allergies')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Add allergy to patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 201, description: 'Allergy added successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async addAllergy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateAllergyDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const allergy = await this.patientsService.addAllergy(id, createDto, currentUserId);
    return {
      success: true,
      message: 'Allergy added successfully',
      data: allergy,
    };
  }

  @Get(':id/allergies')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all allergies for patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Allergies retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findAllAllergies(@Param('id', ParseUUIDPipe) id: string) {
    const allergies = await this.patientsService.findAllAllergies(id);
    return {
      success: true,
      data: allergies,
    };
  }

  @Patch(':id/allergies/:allergyId')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update allergy' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'allergyId', description: 'Allergy UUID' })
  @ApiResponse({ status: 200, description: 'Allergy updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient or allergy not found' })
  async updateAllergy(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('allergyId', ParseUUIDPipe) allergyId: string,
    @Body() updateDto: UpdateAllergyDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const allergy = await this.patientsService.updateAllergy(id, allergyId, updateDto, currentUserId);
    return {
      success: true,
      message: 'Allergy updated successfully',
      data: allergy,
    };
  }

  @Delete(':id/allergies/:allergyId')
  @Roles(...PATIENT_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove allergy (soft delete)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'allergyId', description: 'Allergy UUID' })
  @ApiResponse({ status: 200, description: 'Allergy removed successfully' })
  @ApiResponse({ status: 404, description: 'Patient or allergy not found' })
  async removeAllergy(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('allergyId', ParseUUIDPipe) allergyId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.patientsService.removeAllergy(id, allergyId, currentUserId);
    return {
      success: true,
      message: 'Allergy removed successfully',
    };
  }

  // ==================== Medical Aid ====================

  @Post(':id/medical-aid')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Add medical aid to patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 201, description: 'Medical aid added successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async addMedicalAid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateMedicalAidDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const medicalAid = await this.patientsService.addMedicalAid(id, createDto, currentUserId);
    return {
      success: true,
      message: 'Medical aid added successfully',
      data: medicalAid,
    };
  }

  @Get(':id/medical-aid')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all medical aid for patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Medical aid retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findAllMedicalAid(@Param('id', ParseUUIDPipe) id: string) {
    const medicalAid = await this.patientsService.findAllMedicalAid(id);
    return {
      success: true,
      data: medicalAid,
    };
  }

  @Patch(':id/medical-aid/:medicalAidId')
  @Roles(...PATIENT_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update medical aid' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'medicalAidId', description: 'Medical aid UUID' })
  @ApiResponse({ status: 200, description: 'Medical aid updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient or medical aid not found' })
  async updateMedicalAid(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('medicalAidId', ParseUUIDPipe) medicalAidId: string,
    @Body() updateDto: UpdateMedicalAidDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const medicalAid = await this.patientsService.updateMedicalAid(
      id,
      medicalAidId,
      updateDto,
      currentUserId,
    );
    return {
      success: true,
      message: 'Medical aid updated successfully',
      data: medicalAid,
    };
  }

  @Delete(':id/medical-aid/:medicalAidId')
  @Roles(...PATIENT_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove medical aid (soft delete)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiParam({ name: 'medicalAidId', description: 'Medical aid UUID' })
  @ApiResponse({ status: 200, description: 'Medical aid removed successfully' })
  @ApiResponse({ status: 404, description: 'Patient or medical aid not found' })
  async removeMedicalAid(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('medicalAidId', ParseUUIDPipe) medicalAidId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.patientsService.removeMedicalAid(id, medicalAidId, currentUserId);
    return {
      success: true,
      message: 'Medical aid removed successfully',
    };
  }
}
