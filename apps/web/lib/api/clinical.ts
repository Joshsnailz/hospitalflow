import { apiClient } from './client';
import type {
  Encounter,
  ClinicalNote,
  Appointment,
  CreateAppointmentDto,
  DischargeForm,
  ImagingRequest,
  CreateImagingRequestDto,
  ControlledDrugEntry,
  CreateControlledDrugEntryDto,
  EmergencyVisit,
  CreateEmergencyVisitDto,
  CarePlan,
  CreateCarePlanDto,
} from '../types/clinical';

export const clinicalApi = {
  // Dashboard — returns role-specific stats based on the authenticated user's role
  getDashboardStats: async (params?: Record<string, any>): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.get('/dashboard/stats', { params });
    return response.data;
  },

  // Encounters
  createEncounter: async (data: Record<string, any>): Promise<{ success: boolean; data: Encounter }> => {
    const response = await apiClient.post('/encounters', data);
    return response.data;
  },

  getEncounters: async (params?: Record<string, any>): Promise<{ success: boolean; data: Encounter[]; total?: number }> => {
    const response = await apiClient.get('/encounters', { params });
    return response.data;
  },

  getEncounter: async (id: string): Promise<{ success: boolean; data: Encounter }> => {
    const response = await apiClient.get(`/encounters/${id}`);
    return response.data;
  },

  updateEncounter: async (id: string, data: Record<string, any>): Promise<{ success: boolean; data: Encounter }> => {
    const response = await apiClient.patch(`/encounters/${id}`, data);
    return response.data;
  },

  addClinicalNote: async (encounterId: string, data: Record<string, any>): Promise<{ success: boolean; data: ClinicalNote }> => {
    const response = await apiClient.post(`/encounters/${encounterId}/notes`, data);
    return response.data;
  },

  getEncounterNotes: async (encounterId: string): Promise<{ success: boolean; data: ClinicalNote[] }> => {
    const response = await apiClient.get(`/encounters/${encounterId}/notes`);
    return response.data;
  },

  // Appointments
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
    const response = await apiClient.post(`/appointments/${id}/cancel`, { cancellationReason: reason });
    return response.data;
  },

  rescheduleAppointment: async (id: string, data: { scheduledDate: string; scheduledTime: string; reason?: string }): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.post(`/appointments/${id}/reschedule`, data);
    return response.data;
  },

  referAppointment: async (id: string, data: { referredTo: string; departmentId?: string; reason?: string }): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.post(`/appointments/${id}/refer`, data);
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

  // Queue-based appointment methods
  getAppointmentQueue: async (params?: { hospitalId?: string; departmentId?: string }): Promise<{ success: boolean; data: Appointment[]; total: number }> => {
    const response = await apiClient.get('/appointments/queue', { params });
    return response.data;
  },

  getMyAppointments: async (params?: Record<string, any>): Promise<{ success: boolean; data: Appointment[]; total: number }> => {
    const response = await apiClient.get('/appointments/my-appointments', { params });
    return response.data;
  },

  assignClinician: async (appointmentId: string, clinicianId: string): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.post(`/appointments/${appointmentId}/assign`, { clinicianId });
    return response.data;
  },

  acceptAppointment: async (appointmentId: string): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.post(`/appointments/${appointmentId}/accept`);
    return response.data;
  },

  rejectAppointment: async (appointmentId: string, reason: string): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.post(`/appointments/${appointmentId}/reject`, { reason });
    return response.data;
  },

  referAppointmentTo: async (appointmentId: string, referToClinicianId: string, notes?: string): Promise<{ success: boolean; data: Appointment }> => {
    const response = await apiClient.post(`/appointments/${appointmentId}/refer`, { referToClinicianId, notes });
    return response.data;
  },

  // Discharge
  createDischargeForm: async (data: Record<string, any>): Promise<{ success: boolean; data: DischargeForm }> => {
    const response = await apiClient.post('/discharge', data);
    return response.data;
  },

  getDischargeForms: async (params?: Record<string, any>): Promise<{ success: boolean; data: DischargeForm[]; total?: number }> => {
    const response = await apiClient.get('/discharge', { params });
    return response.data;
  },

  getDischargeForm: async (id: string): Promise<{ success: boolean; data: DischargeForm }> => {
    const response = await apiClient.get(`/discharge/${id}`);
    return response.data;
  },

  updateDischargeSection: async (id: string, data: { section: string; content: Record<string, any>; version: number }): Promise<{ success: boolean; data: DischargeForm }> => {
    const response = await apiClient.patch(`/discharge/${id}/section`, data);
    return response.data;
  },

  completeDischarge: async (id: string, data?: Record<string, any>): Promise<{ success: boolean; data: DischargeForm }> => {
    const response = await apiClient.post(`/discharge/${id}/complete`, data || {});
    return response.data;
  },

  getPatientDischargeForms: async (patientId: string): Promise<{ success: boolean; data: DischargeForm[] }> => {
    const response = await apiClient.get(`/discharge/patient/${patientId}`);
    return response.data;
  },

  // Imaging
  createImagingRequest: async (data: CreateImagingRequestDto): Promise<{ success: boolean; data: ImagingRequest }> => {
    const response = await apiClient.post('/imaging', data);
    return response.data;
  },

  getImagingRequests: async (params?: Record<string, any>): Promise<{ success: boolean; data: ImagingRequest[]; total?: number }> => {
    const response = await apiClient.get('/imaging', { params });
    return response.data;
  },

  getImagingRequest: async (id: string): Promise<{ success: boolean; data: ImagingRequest }> => {
    const response = await apiClient.get(`/imaging/${id}`);
    return response.data;
  },

  updateImagingRequest: async (id: string, data: Record<string, any>): Promise<{ success: boolean; data: ImagingRequest }> => {
    const response = await apiClient.patch(`/imaging/${id}`, data);
    return response.data;
  },

  // Controlled Drugs
  createControlledDrugEntry: async (data: CreateControlledDrugEntryDto): Promise<{ success: boolean; data: ControlledDrugEntry }> => {
    const response = await apiClient.post('/controlled-drugs', data);
    return response.data;
  },

  getControlledDrugEntries: async (params?: Record<string, any>): Promise<{ success: boolean; data: ControlledDrugEntry[]; total?: number }> => {
    const response = await apiClient.get('/controlled-drugs', { params });
    return response.data;
  },

  getControlledDrugEntry: async (id: string): Promise<{ success: boolean; data: ControlledDrugEntry }> => {
    const response = await apiClient.get(`/controlled-drugs/${id}`);
    return response.data;
  },

  updateControlledDrugEntry: async (id: string, data: Record<string, any>): Promise<{ success: boolean; data: ControlledDrugEntry }> => {
    const response = await apiClient.patch(`/controlled-drugs/${id}`, data);
    return response.data;
  },

  // Emergency
  createEmergencyVisit: async (data: CreateEmergencyVisitDto): Promise<{ success: boolean; data: EmergencyVisit }> => {
    const response = await apiClient.post('/emergency', data);
    return response.data;
  },

  getEmergencyVisits: async (params?: Record<string, any>): Promise<{ success: boolean; data: EmergencyVisit[]; total?: number }> => {
    const response = await apiClient.get('/emergency', { params });
    return response.data;
  },

  getEmergencyVisit: async (id: string): Promise<{ success: boolean; data: EmergencyVisit }> => {
    const response = await apiClient.get(`/emergency/${id}`);
    return response.data;
  },

  updateEmergencyVisit: async (id: string, data: Record<string, any>): Promise<{ success: boolean; data: EmergencyVisit }> => {
    const response = await apiClient.patch(`/emergency/${id}`, data);
    return response.data;
  },

  // Care Plans
  createCarePlan: async (data: CreateCarePlanDto): Promise<{ success: boolean; data: CarePlan }> => {
    const response = await apiClient.post('/care-plans', data);
    return response.data;
  },

  getCarePlans: async (params?: Record<string, any>): Promise<{ success: boolean; data: CarePlan[]; total?: number }> => {
    const response = await apiClient.get('/care-plans', { params });
    return response.data;
  },

  getCarePlan: async (id: string): Promise<{ success: boolean; data: CarePlan }> => {
    const response = await apiClient.get(`/care-plans/${id}`);
    return response.data;
  },

  updateCarePlan: async (id: string, data: Record<string, any>): Promise<{ success: boolean; data: CarePlan }> => {
    const response = await apiClient.patch(`/care-plans/${id}`, data);
    return response.data;
  },

  // Patient Journey
  checkInAppointment: async (id: string) => {
    const response = await apiClient.post(`/appointments/${id}/check-in`);
    return response.data;
  },

  completeAppointment: async (id: string, data: any) => {
    const response = await apiClient.post(`/appointments/${id}/complete`, data);
    return response.data;
  },

  assignBedToEncounter: async (encounterId: string, data: { wardId: string; bedId: string }) => {
    const response = await apiClient.post(`/encounters/${encounterId}/assign-bed`, data);
    return response.data;
  },

  getEncountersByWard: async (wardId: string) => {
    const response = await apiClient.get(`/encounters/ward/${wardId}`);
    return response.data;
  },

  getEncountersByPatient: async (patientId: string) => {
    const response = await apiClient.get(`/encounters/patient/${patientId}`);
    return response.data;
  },

  disposeEmergencyVisit: async (id: string, data: any) => {
    const response = await apiClient.post(`/emergency/${id}/dispose`, data);
    return response.data;
  },

  getActiveEmergencyVisits: async () => {
    const response = await apiClient.get('/emergency/active');
    return response.data;
  },

  getEmergencyVisitsByPatient: async (patientId: string) => {
    const response = await apiClient.get(`/emergency/patient/${patientId}`);
    return response.data;
  },

};
