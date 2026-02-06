import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class ClinicalService {
  constructor(private readonly httpService: HttpService) {}

  // ==================== Encounters ====================

  async createEncounter(dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/encounters', dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllEncounters(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/encounters', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOneEncounter(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/encounters/${id}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateEncounter(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/encounters/${id}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async addClinicalNote(encounterId: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/encounters/${encounterId}/notes`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getEncounterNotes(encounterId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/encounters/${encounterId}/notes`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

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

  // ==================== Discharge ====================

  async createDischargeForm(dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/discharge', dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllDischargeForms(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/discharge', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOneDischargeForm(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/discharge/${id}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateDischargeSection(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/discharge/${id}/section`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async completeDischarge(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/discharge/${id}/complete`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getPatientDischargeForms(patientId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/discharge/patient/${patientId}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Imaging ====================

  async createImagingRequest(dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/imaging', dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllImagingRequests(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/imaging', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOneImagingRequest(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/imaging/${id}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateImagingRequest(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/imaging/${id}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Controlled Drugs ====================

  async createControlledDrugEntry(dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/controlled-drugs', dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllControlledDrugEntries(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/controlled-drugs', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOneControlledDrugEntry(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/controlled-drugs/${id}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateControlledDrugEntry(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/controlled-drugs/${id}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Emergency ====================

  async createEmergencyVisit(dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/emergency', dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllEmergencyVisits(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/emergency', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOneEmergencyVisit(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/emergency/${id}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateEmergencyVisit(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/emergency/${id}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Care Plans ====================

  async createCarePlan(dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/care-plans', dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllCarePlans(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/care-plans', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOneCarePlan(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/care-plans/${id}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateCarePlan(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/care-plans/${id}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Patient Journey ====================

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

  async assignBedToEncounter(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/encounters/${id}/assign-bed`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getEncountersByWard(wardId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/encounters/ward/${wardId}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async disposeEmergencyVisit(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/emergency/${id}/dispose`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getEncountersByPatient(patientId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/encounters/patient/${patientId}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getEmergencyVisitsByPatient(patientId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/emergency/patient/${patientId}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getActiveEmergencyVisits(authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/emergency/active', {
          headers: { Authorization: authHeader },
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

  async getEncounterDashboardStats(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/encounters/dashboard/stats', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getEmergencyDashboardStats(authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/emergency/dashboard/stats', {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDischargeDashboardStats(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/discharge/dashboard/stats', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/clinical/dashboard/stats', {
          headers: { Authorization: authHeader },
          params: query,
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
      const message = error.response?.data?.message || 'Clinical service error';
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
