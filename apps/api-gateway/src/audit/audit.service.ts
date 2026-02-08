import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly httpService: HttpService) {}

  async getAuditLogs(query: Record<string, any>, authHeader: string): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService.get('/audit/logs', {
        params: query,
        headers: { Authorization: authHeader },
      }),
    );
    return data;
  }

  async getAuditLog(id: string, authHeader: string): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService.get(`/audit/logs/${id}`, {
        headers: { Authorization: authHeader },
      }),
    );
    return data;
  }

  async getUserAuditLogs(userId: string, query: Record<string, any>, authHeader: string): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService.get(`/audit/user/${userId}`, {
        params: query,
        headers: { Authorization: authHeader },
      }),
    );
    return data;
  }

  async getDataAccessLogs(query: Record<string, any>, authHeader: string): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService.get('/audit/data-access', {
        params: query,
        headers: { Authorization: authHeader },
      }),
    );
    return data;
  }

  async getPatientAccessLogs(patientId: string, query: Record<string, any>, authHeader: string): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService.get(`/audit/patient/${patientId}`, {
        params: query,
        headers: { Authorization: authHeader },
      }),
    );
    return data;
  }

  async getStatistics(query: Record<string, any>, authHeader: string): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService.get('/audit/statistics', {
        params: query,
        headers: { Authorization: authHeader },
      }),
    );
    return data;
  }

  async createLog(payload: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    status?: string;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
    requestId?: string;
    serviceName?: string;
  }): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post('/audit/logs', payload),
      );
    } catch {
      this.logger.warn('Failed to write audit log', payload.action);
    }
  }
}
