import { apiClient } from './client';
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  UserFilterDto,
  PaginatedUsersResponse,
} from '../types/user';

export interface Clinician {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export const usersApi = {
  // Get all active clinicians (accessible to all authenticated users)
  getClinicians: async (): Promise<{ success: boolean; data: Clinician[] }> => {
    const response = await apiClient.get('/api/v1/auth/clinicians');
    return response.data;
  },

  // Admin user management - uses auth service
  create: async (data: CreateUserDto): Promise<{ success: boolean; data: User & { temporaryPassword: string }; message: string }> => {
    const response = await apiClient.post('/api/v1/auth/admin/users', data);
    return response.data;
  },

  findAll: async (filters?: UserFilterDto): Promise<PaginatedUsersResponse> => {
    const response = await apiClient.get('/api/v1/auth/admin/users', { params: filters });
    return response.data;
  },

  activate: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/auth/admin/users/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/auth/admin/users/${id}/deactivate`);
    return response.data;
  },

  // User profile endpoints - uses user service
  findOne: async (id: string): Promise<{ success: boolean; data: User }> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateUserDto): Promise<{ success: boolean; data: User; message: string }> => {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  updateRole: async (id: string, role: string): Promise<{ success: boolean; data: User; message: string }> => {
    const response = await apiClient.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  getAvailableRoles: async (): Promise<{ success: boolean; data: Array<{ value: string; label: string }> }> => {
    const response = await apiClient.get('/users/roles');
    return response.data;
  },
};
