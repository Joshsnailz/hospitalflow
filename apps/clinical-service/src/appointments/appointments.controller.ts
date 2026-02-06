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
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  AppointmentFilterDto,
  CompleteAppointmentDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { CLINICAL_ACCESS_ROLES } from '../config/roles.config';

@ApiTags('appointments')
@ApiBearerAuth('JWT-auth')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Create a new appointment' })
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
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Create referral appointment' })
  @ApiParam({ name: 'id', description: 'Original Appointment UUID' })
  @ApiResponse({ status: 201, description: 'Referral created successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
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
