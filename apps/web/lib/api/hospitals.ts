import { apiClient } from './client';
import type {
  Hospital,
  Department,
  Ward,
  Bed,
  CreateHospitalDto,
  CreateDepartmentDto,
  CreateWardDto,
  CreateBedDto,
  HospitalStats,
} from '../types/hospital';

export const hospitalsApi = {
  // Hospitals
  create: async (data: CreateHospitalDto): Promise<{ success: boolean; data: Hospital }> => {
    const response = await apiClient.post('/hospitals', data);
    return response.data;
  },

  findAll: async (params?: Record<string, any>): Promise<{ success: boolean; data: Hospital[]; total?: number }> => {
    const response = await apiClient.get('/hospitals', { params });
    return response.data;
  },

  findOne: async (id: string): Promise<{ success: boolean; data: Hospital }> => {
    const response = await apiClient.get(`/hospitals/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateHospitalDto>): Promise<{ success: boolean; data: Hospital }> => {
    const response = await apiClient.patch(`/hospitals/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/hospitals/${id}`);
    return response.data;
  },

  getStats: async (): Promise<{ success: boolean; data: HospitalStats }> => {
    const response = await apiClient.get('/hospitals/stats');
    return response.data;
  },

  // Departments
  createDepartment: async (hospitalId: string, data: CreateDepartmentDto): Promise<{ success: boolean; data: Department }> => {
    const response = await apiClient.post(`/hospitals/${hospitalId}/departments`, data);
    return response.data;
  },

  getDepartments: async (hospitalId: string): Promise<{ success: boolean; data: Department[] }> => {
    const response = await apiClient.get(`/hospitals/${hospitalId}/departments`);
    return response.data;
  },

  updateDepartment: async (hospitalId: string, deptId: string, data: Partial<CreateDepartmentDto>): Promise<{ success: boolean; data: Department }> => {
    const response = await apiClient.patch(`/hospitals/${hospitalId}/departments/${deptId}`, data);
    return response.data;
  },

  deleteDepartment: async (hospitalId: string, deptId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/hospitals/${hospitalId}/departments/${deptId}`);
    return response.data;
  },

  // Wards
  createWard: async (hospitalId: string, deptId: string, data: CreateWardDto): Promise<{ success: boolean; data: Ward }> => {
    const response = await apiClient.post(`/hospitals/${hospitalId}/departments/${deptId}/wards`, data);
    return response.data;
  },

  getWards: async (hospitalId: string, deptId: string): Promise<{ success: boolean; data: Ward[] }> => {
    const response = await apiClient.get(`/hospitals/${hospitalId}/departments/${deptId}/wards`);
    return response.data;
  },

  updateWard: async (hospitalId: string, deptId: string, wardId: string, data: Partial<CreateWardDto>): Promise<{ success: boolean; data: Ward }> => {
    const response = await apiClient.patch(`/hospitals/${hospitalId}/departments/${deptId}/wards/${wardId}`, data);
    return response.data;
  },

  deleteWard: async (hospitalId: string, deptId: string, wardId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/hospitals/${hospitalId}/departments/${deptId}/wards/${wardId}`);
    return response.data;
  },

  // Beds
  createBed: async (wardId: string, data: CreateBedDto): Promise<{ success: boolean; data: Bed }> => {
    const response = await apiClient.post(`/hospitals/wards/${wardId}/beds`, data);
    return response.data;
  },

  getBeds: async (wardId: string): Promise<{ success: boolean; data: Bed[] }> => {
    const response = await apiClient.get(`/hospitals/wards/${wardId}/beds`);
    return response.data;
  },

  updateBed: async (wardId: string, bedId: string, data: Partial<CreateBedDto>): Promise<{ success: boolean; data: Bed }> => {
    const response = await apiClient.patch(`/hospitals/wards/${wardId}/beds/${bedId}`, data);
    return response.data;
  },

  deleteBed: async (wardId: string, bedId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/hospitals/wards/${wardId}/beds/${bedId}`);
    return response.data;
  },

  // Available Beds & Dashboard
  getAvailableBeds: async (params?: { hospitalId?: string; departmentId?: string; wardId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.hospitalId) searchParams.append('hospitalId', params.hospitalId);
    if (params?.departmentId) searchParams.append('departmentId', params.departmentId);
    if (params?.wardId) searchParams.append('wardId', params.wardId);
    const response = await apiClient.get(`/hospitals/beds/available?${searchParams.toString()}`);
    return response.data;
  },

  updateBedStatus: async (bedId: string, data: { status: string; currentPatientId?: string }) => {
    const response = await apiClient.patch(`/hospitals/beds/${bedId}/status`, data);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await apiClient.get('/hospitals/dashboard/stats');
    return response.data;
  },
};
