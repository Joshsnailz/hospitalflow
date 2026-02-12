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
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // ==================== Appointments ====================

  @ApiTags('appointments')
  @Post('appointments')
  async createAppointment(
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.createAppointment(dto, authHeader);
  }

  @ApiTags('appointments')
  @Get('appointments')
  async findAllAppointments(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.findAllAppointments(query, authHeader);
  }

  @ApiTags('appointments')
  @Get('appointments/dashboard/stats')
  async getAppointmentDashboardStats(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.getAppointmentDashboardStats(query, authHeader);
  }

  @ApiTags('appointments')
  @Get('appointments/queue')
  async getAppointmentQueue(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.getAppointmentQueue(query, authHeader);
  }

  @ApiTags('appointments')
  @Get('appointments/doctor/:doctorId/upcoming')
  async getUpcomingAppointments(
    @Param('doctorId') doctorId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.getUpcomingAppointments(doctorId, authHeader);
  }

  @ApiTags('appointments')
  @Get('appointments/patient/:patientId')
  async getPatientAppointments(
    @Param('patientId') patientId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.getPatientAppointments(patientId, authHeader);
  }

  @ApiTags('appointments')
  @Get('appointments/:id')
  async findOneAppointment(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.findOneAppointment(id, authHeader);
  }

  @ApiTags('appointments')
  @Patch('appointments/:id')
  async updateAppointment(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.updateAppointment(id, dto, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/accept')
  async acceptAppointment(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.acceptAppointment(id, dto, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/attend')
  async attendAppointment(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.attendAppointment(id, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/check-in')
  async checkInAppointment(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.checkInAppointment(id, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/complete')
  async completeAppointment(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.completeAppointment(id, dto, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/reschedule')
  async rescheduleAppointment(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.rescheduleAppointment(id, dto, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/request-reschedule')
  async requestReschedule(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.requestReschedule(id, dto, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/cancel')
  async cancelAppointment(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.cancelAppointment(id, dto, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/request-cancel')
  async requestCancelAppointment(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.requestCancelAppointment(id, dto, authHeader);
  }

  @ApiTags('appointments')
  @Post('appointments/:id/refer')
  async referAppointment(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.referAppointment(id, dto, authHeader);
  }

  // ==================== Availability ====================

  @ApiTags('availability')
  @Get('availability')
  async getAllAvailability(
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.getAllAvailability(authHeader);
  }

  @ApiTags('availability')
  @Get('availability/me')
  async getMyAvailability(
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.getMyAvailability(authHeader);
  }

  @ApiTags('availability')
  @Get('availability/available')
  async getAvailableClinicians(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.getAvailableClinicians(query, authHeader);
  }

  @ApiTags('availability')
  @Patch('availability/status')
  async updateMyAvailability(
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.updateMyAvailability(dto, authHeader);
  }

  // ==================== Reschedule Requests ====================

  @ApiTags('reschedule-requests')
  @Get('reschedule-requests')
  async getRescheduleRequests(
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.getRescheduleRequests(authHeader);
  }

  @ApiTags('reschedule-requests')
  @Get('reschedule-requests/appointment/:id')
  async getRescheduleRequestsByAppointment(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.getRescheduleRequestsByAppointment(id, authHeader);
  }

  @ApiTags('reschedule-requests')
  @Post('reschedule-requests/:id/resolve')
  async resolveRescheduleRequest(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.appointmentsService.resolveRescheduleRequest(id, dto, authHeader);
  }
}
