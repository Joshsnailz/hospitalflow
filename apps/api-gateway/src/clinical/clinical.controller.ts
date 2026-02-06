import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClinicalService } from './clinical.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) {}

  // ==================== Dashboard Stats ====================

  @ApiTags('dashboard')
  @Get('dashboard/stats')
  async getDashboardStats(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getDashboardStats(query, authHeader);
  }

  @ApiTags('dashboard')
  @Get('dashboard/appointments')
  async getAppointmentDashboardStats(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getAppointmentDashboardStats(query, authHeader);
  }

  @ApiTags('dashboard')
  @Get('dashboard/encounters')
  async getEncounterDashboardStats(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getEncounterDashboardStats(query, authHeader);
  }

  @ApiTags('dashboard')
  @Get('dashboard/emergency')
  async getEmergencyDashboardStats(
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getEmergencyDashboardStats(authHeader);
  }

  @ApiTags('dashboard')
  @Get('dashboard/discharge')
  async getDischargeDashboardStats(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getDischargeDashboardStats(query, authHeader);
  }

  // ==================== Encounters ====================

  @ApiTags('encounters')
  @Post('encounters')
  async createEncounter(
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.createEncounter(dto, authHeader);
  }

  @ApiTags('encounters')
  @Get('encounters')
  async findAllEncounters(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findAllEncounters(query, authHeader);
  }

  @ApiTags('encounters')
  @Post('encounters/:id/assign-bed')
  async assignBedToEncounter(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.assignBedToEncounter(id, dto, authHeader);
  }

  @ApiTags('encounters')
  @Get('encounters/ward/:wardId')
  async getEncountersByWard(
    @Param('wardId') wardId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getEncountersByWard(wardId, authHeader);
  }

  @ApiTags('encounters')
  @Get('encounters/patient/:patientId')
  async getEncountersByPatient(
    @Param('patientId') patientId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getEncountersByPatient(patientId, authHeader);
  }

  @ApiTags('encounters')
  @Get('encounters/:id')
  async findOneEncounter(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findOneEncounter(id, authHeader);
  }

  @ApiTags('encounters')
  @Patch('encounters/:id')
  async updateEncounter(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.updateEncounter(id, dto, authHeader);
  }

  @ApiTags('encounters')
  @Post('encounters/:id/notes')
  async addClinicalNote(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.addClinicalNote(id, dto, authHeader);
  }

  @ApiTags('encounters')
  @Get('encounters/:id/notes')
  async getEncounterNotes(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getEncounterNotes(id, authHeader);
  }

  // ==================== Appointments ====================

  @ApiTags('appointments')
  @Post('appointments')
  async createAppointment(
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.createAppointment(dto, authHeader);
  }

  @ApiTags('appointments')
  @Get('appointments')
  async findAllAppointments(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findAllAppointments(query, authHeader);
  }

  @ApiTags('appointments')
  @Get('appointments/doctor/:doctorId/upcoming')
  async getUpcomingAppointments(
    @Param('doctorId') doctorId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getUpcomingAppointments(doctorId, authHeader);
  }

  @ApiTags('appointments')
  @Get('appointments/patient/:patientId')
  async getPatientAppointments(
    @Param('patientId') patientId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getPatientAppointments(patientId, authHeader);
  }

  @ApiTags('appointments')
  @Get('appointments/:id')
  async findOneAppointment(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findOneAppointment(id, authHeader);
  }

  @ApiTags('appointments')
  @Patch('appointments/:id')
  async updateAppointment(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.updateAppointment(id, dto, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/cancel')
  async cancelAppointment(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.cancelAppointment(id, dto, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/reschedule')
  async rescheduleAppointment(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.rescheduleAppointment(id, dto, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/refer')
  async referAppointment(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.referAppointment(id, dto, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/check-in')
  async checkInAppointment(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.checkInAppointment(id, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/complete')
  async completeAppointment(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.completeAppointment(id, dto, authHeader);
  }

  // ==================== Discharge ====================

  @ApiTags('discharge')
  @Post('discharge')
  async createDischargeForm(
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.createDischargeForm(dto, authHeader);
  }

  @ApiTags('discharge')
  @Get('discharge')
  async findAllDischargeForms(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findAllDischargeForms(query, authHeader);
  }

  @ApiTags('discharge')
  @Get('discharge/patient/:patientId')
  async getPatientDischargeForms(
    @Param('patientId') patientId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getPatientDischargeForms(patientId, authHeader);
  }

  @ApiTags('discharge')
  @Get('discharge/:id')
  async findOneDischargeForm(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findOneDischargeForm(id, authHeader);
  }

  @ApiTags('discharge')
  @Patch('discharge/:id/section')
  async updateDischargeSection(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.updateDischargeSection(id, dto, authHeader);
  }

  @ApiTags('discharge')
  @Post('discharge/:id/complete')
  async completeDischarge(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.completeDischarge(id, dto, authHeader);
  }

  // ==================== Imaging ====================

  @ApiTags('imaging')
  @Post('imaging')
  async createImagingRequest(
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.createImagingRequest(dto, authHeader);
  }

  @ApiTags('imaging')
  @Get('imaging')
  async findAllImagingRequests(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findAllImagingRequests(query, authHeader);
  }

  @ApiTags('imaging')
  @Get('imaging/:id')
  async findOneImagingRequest(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findOneImagingRequest(id, authHeader);
  }

  @ApiTags('imaging')
  @Patch('imaging/:id')
  async updateImagingRequest(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.updateImagingRequest(id, dto, authHeader);
  }

  // ==================== Controlled Drugs ====================

  @ApiTags('controlled-drugs')
  @Post('controlled-drugs')
  async createControlledDrugEntry(
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.createControlledDrugEntry(dto, authHeader);
  }

  @ApiTags('controlled-drugs')
  @Get('controlled-drugs')
  async findAllControlledDrugEntries(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findAllControlledDrugEntries(query, authHeader);
  }

  @ApiTags('controlled-drugs')
  @Get('controlled-drugs/:id')
  async findOneControlledDrugEntry(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findOneControlledDrugEntry(id, authHeader);
  }

  @ApiTags('controlled-drugs')
  @Patch('controlled-drugs/:id')
  async updateControlledDrugEntry(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.updateControlledDrugEntry(id, dto, authHeader);
  }

  // ==================== Emergency ====================

  @ApiTags('emergency')
  @Post('emergency')
  async createEmergencyVisit(
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.createEmergencyVisit(dto, authHeader);
  }

  @ApiTags('emergency')
  @Get('emergency')
  async findAllEmergencyVisits(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findAllEmergencyVisits(query, authHeader);
  }

  @ApiTags('emergency')
  @Get('emergency/active')
  async getActiveEmergencyVisits(
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getActiveEmergencyVisits(authHeader);
  }

  @ApiTags('emergency')
  @Get('emergency/patient/:patientId')
  async getEmergencyVisitsByPatient(
    @Param('patientId') patientId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.getEmergencyVisitsByPatient(patientId, authHeader);
  }

  @ApiTags('emergency')
  @Post('emergency/:id/dispose')
  async disposeEmergencyVisit(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.disposeEmergencyVisit(id, dto, authHeader);
  }

  @ApiTags('emergency')
  @Get('emergency/:id')
  async findOneEmergencyVisit(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findOneEmergencyVisit(id, authHeader);
  }

  @ApiTags('emergency')
  @Patch('emergency/:id')
  async updateEmergencyVisit(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.updateEmergencyVisit(id, dto, authHeader);
  }

  // ==================== Care Plans ====================

  @ApiTags('care-plans')
  @Post('care-plans')
  async createCarePlan(
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.createCarePlan(dto, authHeader);
  }

  @ApiTags('care-plans')
  @Get('care-plans')
  async findAllCarePlans(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findAllCarePlans(query, authHeader);
  }

  @ApiTags('care-plans')
  @Get('care-plans/:id')
  async findOneCarePlan(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.findOneCarePlan(id, authHeader);
  }

  @ApiTags('care-plans')
  @Patch('care-plans/:id')
  async updateCarePlan(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.clinicalService.updateCarePlan(id, dto, authHeader);
  }
}
