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
import { AppointmentsService } from './appointments.service';
import { QueueService } from './services/queue.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  AppointmentFilterDto,
  CompleteAppointmentDto,
  AssignClinicianDto,
  RejectAppointmentDto,
  ReferAppointmentDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { CLINICAL_ACCESS_ROLES, ADMIN_ROLES, ROLES } from '../config/roles.config';

// Clinician roles that can accept/reject/refer appointments
const CLINICIAN_ROLES = [
  ROLES.DOCTOR,
  ROLES.CONSULTANT,
  ROLES.NURSE,
  ROLES.HOSPITAL_PHARMACIST,
  ROLES.PRESCRIBER,
];

@ApiTags('appointments')
@ApiBearerAuth('JWT-auth')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly queueService: QueueService,
  ) {}

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create a new appointment (Admin only)' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const appointment = await this.appointmentsService.create(dto, currentUserId);
    return {
      success: true,
      message: 'Appointment created successfully',
      data: appointment,
    };
  }

  @Get()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all appointments with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async findAll(@Query() filterDto: AppointmentFilterDto) {
    const result = await this.appointmentsService.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('dashboard/stats')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get appointment dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const stats = await this.appointmentsService.getDashboardStats(userId, role);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('queue')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get queued appointments waiting for assignment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Queued appointments retrieved successfully' })
  async getQueue(
    @Query('hospitalId') hospitalId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const queuedAppointments = await this.queueService.getQueuedAppointments(
      hospitalId,
      departmentId,
    );
    return {
      success: true,
      data: queuedAppointments,
      total: queuedAppointments.length,
    };
  }

  @Get('my-appointments')
  @Roles(...CLINICIAN_ROLES)
  @ApiOperation({ summary: 'Get appointments assigned to current clinician' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async getMyAppointments(
    @CurrentUser('id') clinicianId: string,
    @Query() filters: AppointmentFilterDto,
  ) {
    const appointments = await this.appointmentsService.getMyAppointments(
      clinicianId,
      filters,
    );
    return {
      success: true,
      data: appointments,
      total: appointments.length,
    };
  }

  @Get('doctor/:doctorId/upcoming')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get upcoming appointments for a doctor' })
  @ApiParam({ name: 'doctorId', description: 'Doctor UUID' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async getUpcomingByDoctor(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('limit') limit?: number,
  ) {
    const appointments = await this.appointmentsService.getUpcomingByDoctor(doctorId, limit);
    return {
      success: true,
      data: appointments,
    };
  }

  @Get('patient/:patientId')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get all appointments for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async getByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    const appointments = await this.appointmentsService.getByPatient(patientId);
    return {
      success: true,
      data: appointments,
    };
  }

  @Post(':id/assign')
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually assign clinician to appointment (Admin only)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Clinician assigned successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async assignClinician(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignClinicianDto,
    @CurrentUser('id') adminId: string,
  ) {
    const appointment = await this.appointmentsService.assignClinician(
      id,
      dto.clinicianId,
      adminId,
    );
    return {
      success: true,
      message: 'Clinician assigned successfully',
      data: appointment,
    };
  }

  @Post(':id/accept')
  @Roles(...CLINICIAN_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept assigned appointment (Clinician only)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment accepted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot accept appointment in current state' })
  @ApiResponse({ status: 403, description: 'You are not assigned to this appointment' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async acceptAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') clinicianId: string,
  ) {
    const appointment = await this.appointmentsService.acceptAppointment(id, clinicianId);
    return {
      success: true,
      message: 'Appointment accepted successfully',
      data: appointment,
    };
  }

  @Post(':id/reject')
  @Roles(...CLINICIAN_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject assigned appointment (Clinician only)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment rejected and returned to queue' })
  @ApiResponse({ status: 403, description: 'You are not assigned to this appointment' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async rejectAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectAppointmentDto,
    @CurrentUser('id') clinicianId: string,
  ) {
    const appointment = await this.appointmentsService.rejectAppointment(
      id,
      clinicianId,
      dto.reason,
    );
    return {
      success: true,
      message: 'Appointment rejected and returned to queue',
      data: appointment,
    };
  }

  @Post(':id/check-in')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check in a patient for their appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Patient checked in successfully' })
  @ApiResponse({ status: 400, description: 'Invalid appointment status for check-in' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async checkIn(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    const appointment = await this.appointmentsService.checkIn(id, currentUserId);
    return {
      success: true,
      message: 'Patient checked in successfully',
      data: appointment,
    };
  }

  @Post(':id/complete')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete an appointment and optionally create an encounter' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid appointment status for completion' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteAppointmentDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const result = await this.appointmentsService.complete(id, dto, currentUserId);
    return {
      success: true,
      message: 'Appointment completed successfully',
      data: result,
    };
  }

  @Get(':id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const appointment = await this.appointmentsService.findOne(id);
    return {
      success: true,
      data: appointment,
    };
  }

  @Patch(':id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    const appointment = await this.appointmentsService.update(id, dto);
    return {
      success: true,
      message: 'Appointment updated successfully',
      data: appointment,
    };
  }

  @Post(':id/reschedule')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    const appointment = await this.appointmentsService.reschedule(id, dto);
    return {
      success: true,
      message: 'Appointment rescheduled successfully',
      data: appointment,
    };
  }

  @Post(':id/cancel')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    const appointment = await this.appointmentsService.cancel(id, reason);
    return {
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment,
    };
  }

  @Post(':id/refer')
  @Roles(...CLINICIAN_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refer appointment to another clinician (Clinician only)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment referred successfully' })
  @ApiResponse({ status: 403, description: 'You are not assigned to this appointment' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async refer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReferAppointmentDto,
    @CurrentUser('id') clinicianId: string,
  ) {
    const appointment = await this.appointmentsService.referAppointment(
      id,
      clinicianId,
      dto.referToClinicianId,
      dto.notes,
    );
    return {
      success: true,
      message: 'Appointment referred successfully',
      data: appointment,
    };
  }
}
