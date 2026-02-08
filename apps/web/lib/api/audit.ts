import apiClient from './client';

export interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  description: string | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  metadata: Record<string, any> | null;
  requestId: string | null;
  sessionId: string | null;
  serviceName: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface AuditStatistics {
  totalAuditLogs: number;
  totalDataAccessLogs: number;
  logsByAction: Record<string, number>;
  logsByStatus: Record<string, number>;
  logsByAccessType: Record<string, number>;
  logsBySensitivity: Record<string, number>;
  emergencyAccessCount: number;
  uniqueUsersCount: number;
  uniquePatientsCount: number;
}

export interface AuditLogFilter {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  userId?: string;
  userEmail?: string;
  action?: string;
  resource?: string;
  status?: string;
  serviceName?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const auditApi = {
  getLogs: async (filters: AuditLogFilter = {}): Promise<{ success: boolean; data: AuditLog[]; total: number; page: number; limit: number; totalPages: number }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/audit/logs?${params.toString()}`);
    return response.data;
  },

  getLog: async (id: string): Promise<{ success: boolean; data: AuditLog }> => {
    const response = await apiClient.get(`/audit/logs/${id}`);
    return response.data;
  },

  getUserLogs: async (userId: string, filters: AuditLogFilter = {}): Promise<{ success: boolean; data: AuditLog[]; total: number; page: number; limit: number; totalPages: number }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/audit/user/${userId}?${params.toString()}`);
    return response.data;
  },

  getStatistics: async (startDate?: string, endDate?: string): Promise<{ success: boolean; data: AuditStatistics }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await apiClient.get(`/audit/statistics?${params.toString()}`);
    return response.data;
  },

  getDataAccessLogs: async (filters: AuditLogFilter = {}): Promise<{ success: boolean; data: AuditLog[]; total: number; page: number; limit: number; totalPages: number }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/audit/data-access?${params.toString()}`);
    return response.data;
  },
};
