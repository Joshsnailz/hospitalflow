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

/** Raw response shape from the audit-service (flat pagination fields) */
interface AuditLogsRawResponse {
  success: boolean;
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Raw response shape from the audit-service statistics endpoint */
interface AuditStatisticsRawResponse {
  success: boolean;
  data: {
    totalAuditLogs: number;
    totalDataAccessLogs: number;
    auditLogsByAction: Record<string, number>;
    auditLogsByStatus: Record<string, number>;
    dataAccessByType: Record<string, number>;
    dataAccessBySensitivity: Record<string, number>;
    emergencyAccessCount: number;
    uniqueUsersCount: number;
    uniquePatientsAccessedCount: number;
  };
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

/** Normalize the flat paginated response into the nested shape the frontend expects */
function normalizePaginatedResponse(raw: AuditLogsRawResponse): { success: boolean; data: PaginatedAuditLogs } {
  return {
    success: raw.success,
    data: {
      data: raw.data,
      total: raw.total,
      page: raw.page,
      limit: raw.limit,
      totalPages: raw.totalPages,
    },
  };
}

/** Normalize backend statistics field names to frontend interface */
function normalizeStatistics(raw: AuditStatisticsRawResponse): { success: boolean; data: AuditStatistics } {
  const s = raw.data;
  return {
    success: raw.success,
    data: {
      totalAuditLogs: s.totalAuditLogs,
      totalDataAccessLogs: s.totalDataAccessLogs,
      logsByAction: s.auditLogsByAction,
      logsByStatus: s.auditLogsByStatus,
      logsByAccessType: s.dataAccessByType,
      logsBySensitivity: s.dataAccessBySensitivity,
      emergencyAccessCount: s.emergencyAccessCount,
      uniqueUsersCount: s.uniqueUsersCount,
      uniquePatientsCount: s.uniquePatientsAccessedCount,
    },
  };
}

export const auditApi = {
  getLogs: async (filters: AuditLogFilter = {}): Promise<{ success: boolean; data: PaginatedAuditLogs }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<AuditLogsRawResponse>(`/audit/logs?${params.toString()}`);
    return normalizePaginatedResponse(response.data);
  },

  getLog: async (id: string): Promise<{ success: boolean; data: AuditLog }> => {
    const response = await apiClient.get(`/audit/logs/${id}`);
    return response.data;
  },

  getUserLogs: async (userId: string, filters: AuditLogFilter = {}): Promise<{ success: boolean; data: PaginatedAuditLogs }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<AuditLogsRawResponse>(`/audit/user/${userId}?${params.toString()}`);
    return normalizePaginatedResponse(response.data);
  },

  getStatistics: async (startDate?: string, endDate?: string): Promise<{ success: boolean; data: AuditStatistics }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await apiClient.get<AuditStatisticsRawResponse>(`/audit/statistics?${params.toString()}`);
    return normalizeStatistics(response.data);
  },

  getDataAccessLogs: async (filters: AuditLogFilter = {}): Promise<{ success: boolean; data: PaginatedAuditLogs }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<AuditLogsRawResponse>(`/audit/data-access?${params.toString()}`);
    return normalizePaginatedResponse(response.data);
  },
};
