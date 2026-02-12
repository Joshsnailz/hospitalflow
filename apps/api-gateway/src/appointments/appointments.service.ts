import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class AppointmentsService {
  constructor(private readonly httpService: HttpService) {}

  // ==================== Appointments ====================

  async createAppointment(dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/appointments', dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllAppointments(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/appointments', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOneAppointment(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/appointments/${id}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateAppointment(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/appointments/${id}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async cancelAppointment(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/appointments/${id}/cancel`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async requestCancelAppointment(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/appointments/${id}/request-cancel`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async rescheduleAppointment(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/appointments/${id}/reschedule`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async referAppointment(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/appointments/${id}/refer`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUpcomingAppointments(doctorId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/appointments/doctor/${doctorId}/upcoming`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getPatientAppointments(patientId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/appointments/patient/${patientId}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async attendAppointment(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/appointments/${id}/attend`, {}, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async checkInAppointment(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/appointments/${id}/check-in`, {}, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async completeAppointment(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/appointments/${id}/complete`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async acceptAppointment(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/appointments/${id}/accept`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async requestReschedule(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/appointments/${id}/request-reschedule`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getAppointmentQueue(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/appointments/queue', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getAppointmentDashboardStats(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/appointments/dashboard/stats', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Availability ====================

  async getAllAvailability(authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/availability', {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMyAvailability(authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/availability/me', {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getAvailableClinicians(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/availability/available', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateMyAvailability(dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch('/availability/status', dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Reschedule Requests ====================

  async getRescheduleRequests(authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/reschedule-requests', {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getRescheduleRequestsByAppointment(appointmentId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/reschedule-requests/appointment/${appointmentId}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async resolveRescheduleRequest(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/reschedule-requests/${id}/resolve`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data?.message || 'Appointment service error';
      throw new HttpException(
        {
          success: false,
          message,
          error: error.response?.data?.error,
          errors: error.response?.data?.errors,
        },
        status,
      );
    }
    throw new HttpException(
      { success: false, message: 'Internal server error' },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
