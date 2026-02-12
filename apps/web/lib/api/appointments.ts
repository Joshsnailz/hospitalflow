import { apiClient } from './client';
import type {
  Appointment,
  CreateAppointmentDto,
  ClinicianAvailability,
  AvailabilityStatus,
  RescheduleRequest,
} from '../types/appointment';

export const appointmentsApi = {
  // ==================== Appointments ====================

  createAppointment: async (data: CreateAppointmentDto): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.post('/appointments', data);
    return response.data;
  },

  getAppointments: async (params?: Record<string, any>): Promise<{ success: boolean; data: Appointment[]; total?: number }> => {
    const response = await apiClient.get('/appointments', { params });
    return response.data;
  },

  getAppointment: async (id: string): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
  },

  updateAppointment: async (id: string, data: Record<string, any>): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.patch(`/appointments/${id}`, data);
    return response.data;
  },

  cancelAppointment: async (id: string, reason?: string): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.post(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  rescheduleAppointment: async (id: string, data: { newDate: string; reason?: string }): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.post(`/appointments/${id}/reschedule`, data);
    return response.data;
  },

  referAppointment: async (id: string, data: { newDoctorId: string; reason?: string }): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.post(`/appointments/${id}/refer`, data);
    return response.data;
  },

  checkInAppointment: async (id: string): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.post(`/appointments/${id}/check-in`);
    return response.data;
  },

  completeAppointment: async (id: string, data: any): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.post(`/appointments/${id}/complete`, data);
    return response.data;
  },

  acceptAppointment: async (id: string, notes?: string): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.post(`/appointments/${id}/accept`, { notes });
    return response.data;
  },

  attendAppointment: async (id: string): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.post(`/appointments/${id}/attend`);
    return response.data;
  },

  requestReschedule: async (id: string, reason: string): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.post(`/appointments/${id}/request-reschedule`, { reason });
    return response.data;
  },

  requestCancel: async (id: string, reason: string): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.post(`/appointments/${id}/request-cancel`, { reason });
    return response.data;
  },

  getAppointmentQueue: async (params?: Record<string, any>): Promise<{ success: boolean; data: Appointment[] }> => {
    const response = await apiClient.get('/appointments/queue', { params });
    return response.data;
  },

  getUpcomingAppointments: async (doctorId: string): Promise<{ success: boolean; data: Appointment[] }> => {
    const response = await apiClient.get(`/appointments/doctor/${doctorId}/upcoming`);
    return response.data;
  },

  getPatientAppointments: async (patientId: string): Promise<{ success: boolean; data: Appointment[] }> => {
    const response = await apiClient.get(`/appointments/patient/${patientId}`);
    return response.data;
  },

  getDashboardStats: async (params?: Record<string, any>): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.get('/appointments/dashboard/stats', { params });
    return response.data;
  },

  // ==================== Availability ====================

  getMyAvailability: async (): Promise<{ success: boolean; data: ClinicianAvailability }> => {
    const response = await apiClient.get('/availability/me');
    return response.data;
  },

  updateMyAvailability: async (data: {
    status: AvailabilityStatus;
    hospitalId?: string;
    departmentId?: string;
  }): Promise<{ success: boolean; data: ClinicianAvailability }> => {
    const response = await apiClient.patch('/availability/status', data);
    return response.data;
  },

  getAvailableClinicians: async (params?: Record<string, any>): Promise<{ success: boolean; data: ClinicianAvailability[] }> => {
    const response = await apiClient.get('/availability/available', { params });
    return response.data;
  },

  getAllAvailability: async (): Promise<{ success: boolean; data: ClinicianAvailability[] }> => {
    const response = await apiClient.get('/availability');
    return response.data;
  },

  // ==================== Reschedule Requests ====================

  getRescheduleRequests: async (): Promise<{ success: boolean; data: RescheduleRequest[] }> => {
    const response = await apiClient.get('/reschedule-requests');
    return response.data;
  },

  getRescheduleRequestsForAppointment: async (appointmentId: string): Promise<{ success: boolean; data: RescheduleRequest[] }> => {
    const response = await apiClient.get(`/reschedule-requests/appointment/${appointmentId}`);
    return response.data;
  },

  resolveRescheduleRequest: async (id: string, data: {
    resolution: 'approved' | 'rejected';
    newDate?: string;
    notes?: string;
  }): Promise<{ success: boolean; data: RescheduleRequest }> => {
    const response = await apiClient.post(`/reschedule-requests/${id}/resolve`, data);
    return response.data;
  },
};
