import { apiClient } from './client';
import type {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
  PatientFilterDto,
  PaginatedResponse,
  ChiValidationResult,
  NextOfKin,
  CreateNextOfKinDto,
  Allergy,
  CreateAllergyDto,
  MedicalHistory,
  CreateMedicalHistoryDto,
  MedicalAid,
  CreateMedicalAidDto,
} from '../types/patient';

export const patientsApi = {
  // Patient CRUD
  create: async (data: CreatePatientDto): Promise<{ success: boolean; data: Patient; message: string }> => {
    const response = await apiClient.post('/patients', data);
    return response.data;
  },

  findAll: async (filters?: PatientFilterDto): Promise<PaginatedResponse<Patient>> => {
    const response = await apiClient.get('/patients', { params: filters });
    return response.data;
  },

  findOne: async (id: string): Promise<{ success: boolean; data: Patient }> => {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  },

  findByChiNumber: async (chi: string): Promise<{ success: boolean; data: Patient }> => {
    const response = await apiClient.get(`/patients/chi/${chi}`);
    return response.data;
  },

  validateChi: async (chi: string): Promise<{ success: boolean; data: ChiValidationResult }> => {
    const response = await apiClient.get(`/patients/validate-chi/${chi}`);
    return response.data;
  },

  update: async (id: string, data: UpdatePatientDto): Promise<{ success: boolean; data: Patient; message: string }> => {
    const response = await apiClient.patch(`/patients/${id}`, data);
    return response.data;
  },

  deactivate: async (id: string): Promise<{ success: boolean; data: Patient; message: string }> => {
    const response = await apiClient.post(`/patients/${id}/deactivate`);
    return response.data;
  },

  reactivate: async (id: string): Promise<{ success: boolean; data: Patient; message: string }> => {
    const response = await apiClient.post(`/patients/${id}/reactivate`);
    return response.data;
  },

  // Next of Kin
  addNextOfKin: async (patientId: string, data: CreateNextOfKinDto): Promise<{ success: boolean; data: NextOfKin; message: string }> => {
    const response = await apiClient.post(`/patients/${patientId}/next-of-kin`, data);
    return response.data;
  },

  getNextOfKin: async (patientId: string): Promise<{ success: boolean; data: NextOfKin[] }> => {
    const response = await apiClient.get(`/patients/${patientId}/next-of-kin`);
    return response.data;
  },

  updateNextOfKin: async (patientId: string, nokId: string, data: Partial<CreateNextOfKinDto>): Promise<{ success: boolean; data: NextOfKin; message: string }> => {
    const response = await apiClient.patch(`/patients/${patientId}/next-of-kin/${nokId}`, data);
    return response.data;
  },

  removeNextOfKin: async (patientId: string, nokId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/patients/${patientId}/next-of-kin/${nokId}`);
    return response.data;
  },

  // Allergies
  addAllergy: async (patientId: string, data: CreateAllergyDto): Promise<{ success: boolean; data: Allergy; message: string }> => {
    const response = await apiClient.post(`/patients/${patientId}/allergies`, data);
    return response.data;
  },

  getAllergies: async (patientId: string): Promise<{ success: boolean; data: Allergy[] }> => {
    const response = await apiClient.get(`/patients/${patientId}/allergies`);
    return response.data;
  },

  updateAllergy: async (patientId: string, allergyId: string, data: Partial<CreateAllergyDto>): Promise<{ success: boolean; data: Allergy; message: string }> => {
    const response = await apiClient.patch(`/patients/${patientId}/allergies/${allergyId}`, data);
    return response.data;
  },

  removeAllergy: async (patientId: string, allergyId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/patients/${patientId}/allergies/${allergyId}`);
    return response.data;
  },

  // Medical History
  addMedicalHistory: async (patientId: string, data: CreateMedicalHistoryDto): Promise<{ success: boolean; data: MedicalHistory; message: string }> => {
    const response = await apiClient.post(`/patients/${patientId}/medical-history`, data);
    return response.data;
  },

  getMedicalHistory: async (patientId: string): Promise<{ success: boolean; data: MedicalHistory[] }> => {
    const response = await apiClient.get(`/patients/${patientId}/medical-history`);
    return response.data;
  },

  updateMedicalHistory: async (patientId: string, historyId: string, data: Partial<CreateMedicalHistoryDto>): Promise<{ success: boolean; data: MedicalHistory; message: string }> => {
    const response = await apiClient.patch(`/patients/${patientId}/medical-history/${historyId}`, data);
    return response.data;
  },

  removeMedicalHistory: async (patientId: string, historyId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/patients/${patientId}/medical-history/${historyId}`);
    return response.data;
  },

  // Medical Aid
  addMedicalAid: async (patientId: string, data: CreateMedicalAidDto): Promise<{ success: boolean; data: MedicalAid; message: string }> => {
    const response = await apiClient.post(`/patients/${patientId}/medical-aid`, data);
    return response.data;
  },

  getMedicalAid: async (patientId: string): Promise<{ success: boolean; data: MedicalAid[] }> => {
    const response = await apiClient.get(`/patients/${patientId}/medical-aid`);
    return response.data;
  },

  updateMedicalAid: async (patientId: string, medicalAidId: string, data: Partial<CreateMedicalAidDto>): Promise<{ success: boolean; data: MedicalAid; message: string }> => {
    const response = await apiClient.patch(`/patients/${patientId}/medical-aid/${medicalAidId}`, data);
    return response.data;
  },

  removeMedicalAid: async (patientId: string, medicalAidId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/patients/${patientId}/medical-aid/${medicalAidId}`);
    return response.data;
  },
};
