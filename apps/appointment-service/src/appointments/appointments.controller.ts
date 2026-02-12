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
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  AppointmentFilterDto,
  CompleteAppointmentDto,
  AcceptAppointmentDto,
  RequestRescheduleDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { CLINICAL_ACCESS_ROLES, ADMIN_ROLES } from '../config/roles.config';

@ApiTags('appointments')
@ApiBearerAuth('JWT-auth')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create a new appointment (admin only)' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
    @Headers('authorization') authHeader: string,
  ) {
    const appointment = await this.appointmentsService.create(dto, currentUser, authHeader);
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
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get unassigned appointment queue' })
  @ApiResponse({ status: 200, description: 'Queue retrieved successfully' })
  async getQueue(@Query('hospitalId') hospitalId?: string) {
    const data = await this.appointmentsService.getQueue(hospitalId);
    return {
      success: true,
      data,
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
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update appointment (admin only)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser('id') userId: string,
  ) {
    const appointment = await this.appointmentsService.update(id, dto, userId);
    return {
      success: true,
      message: 'Appointment updated successfully',
      data: appointment,
    };
  }

  @Post(':id/accept')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept appointment from queue' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment accepted' })
  async accept(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcceptAppointmentDto,
    @CurrentUser() currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
    @Headers('authorization') authHeader: string,
  ) {
    const result = await this.appointmentsService.accept(id, dto, currentUser, authHeader);
    return {
      success: true,
      message: 'Appointment accepted successfully',
      data: result,
    };
  }

  @Post(':id/attend')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Attend a scheduled appointment (creates encounter + discharge)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Attending appointment' })
  async attend(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
    @Headers('authorization') authHeader: string,
  ) {
    const result = await this.appointmentsService.attend(id, currentUser, authHeader);
    return {
      success: true,
      message: 'Now attending appointment',
      data: result,
    };
  }

  @Post(':id/check-in')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check in a patient for their appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Patient checked in successfully' })
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

  @Post(':id/reschedule')
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule appointment (admin only)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled successfully' })
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

  @Post(':id/request-reschedule')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a reschedule (clinician)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Reschedule request created' })
  async requestReschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestRescheduleDto,
    @CurrentUser() currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
  ) {
    const result = await this.appointmentsService.requestReschedule(id, dto, currentUser);
    return {
      success: true,
      message: 'Reschedule request submitted',
      data: result,
    };
  }

  @Post(':id/cancel')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
    @CurrentUser('id') userId?: string,
  ) {
    const appointment = await this.appointmentsService.cancel(id, reason, userId);
    return {
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment,
    };
  }

  @Post(':id/request-cancel')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request cancellation (clinician, requires admin approval)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Cancellation request created' })
  async requestCancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
  ) {
    const result = await this.appointmentsService.requestCancel(id, reason, currentUser);
    return {
      success: true,
      message: 'Cancellation request submitted for admin review',
      data: result,
    };
  }

  @Post(':id/refer')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Create referral appointment' })
  @ApiParam({ name: 'id', description: 'Original Appointment UUID' })
  @ApiResponse({ status: 201, description: 'Referral created successfully' })
  async refer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('newDoctorId', ParseUUIDPipe) newDoctorId: string,
    @Body('reason') reason: string,
  ) {
    const referral = await this.appointmentsService.refer(id, newDoctorId, reason);
    return {
      success: true,
      message: 'Referral created successfully',
      data: referral,
    };
  }
}
