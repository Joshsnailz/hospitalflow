import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class RbacService {
  constructor(private readonly httpService: HttpService) {}

  // Roles
  async getRoles(authHeader: string) {
    return this.makeRequest('get', '/roles', authHeader);
  }

  async getRole(id: string, authHeader: string) {
    return this.makeRequest('get', `/roles/${id}`, authHeader);
  }

  async createRole(data: Record<string, any>, authHeader: string) {
    return this.makeRequest('post', '/roles', authHeader, data);
  }

  async updateRole(id: string, data: Record<string, any>, authHeader: string) {
    return this.makeRequest('patch', `/roles/${id}`, authHeader, data);
  }

  async deleteRole(id: string, authHeader: string) {
    return this.makeRequest('delete', `/roles/${id}`, authHeader);
  }

  async assignRolePermissions(id: string, data: Record<string, any>, authHeader: string) {
    return this.makeRequest('post', `/roles/${id}/permissions`, authHeader, data);
  }

  async getRolePermissions(id: string, authHeader: string) {
    return this.makeRequest('get', `/roles/${id}/permissions`, authHeader);
  }

  // Permissions
  async getPermissions(authHeader: string) {
    return this.makeRequest('get', '/permissions', authHeader);
  }

  async getPermission(id: string, authHeader: string) {
    return this.makeRequest('get', `/permissions/${id}`, authHeader);
  }

  async createPermission(data: Record<string, any>, authHeader: string) {
    return this.makeRequest('post', '/permissions', authHeader, data);
  }

  async checkPermission(data: Record<string, any>) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/permissions/check', data),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUserPermissions(userId: string, data: Record<string, any>, authHeader: string) {
    return this.makeRequest('get', `/permissions/users/${userId}`, authHeader, data);
  }

  async grantUserPermission(userId: string, data: Record<string, any>, authHeader: string) {
    return this.makeRequest('post', `/permissions/users/${userId}`, authHeader, data);
  }

  async revokeUserPermission(userId: string, permissionId: string, authHeader: string) {
    return this.makeRequest('delete', `/permissions/users/${userId}/${permissionId}`, authHeader);
  }

  // Resources
  async getResources(authHeader: string) {
    return this.makeRequest('get', '/resources', authHeader);
  }

  async createResource(data: Record<string, any>, authHeader: string) {
    return this.makeRequest('post', '/resources', authHeader, data);
  }

  // Actions
  async getActions(authHeader: string) {
    return this.makeRequest('get', '/actions', authHeader);
  }

  async createAction(data: Record<string, any>, authHeader: string) {
    return this.makeRequest('post', '/actions', authHeader, data);
  }

  private async makeRequest(
    method: 'get' | 'post' | 'patch' | 'delete',
    url: string,
    authHeader: string,
    data?: Record<string, any>,
  ) {
    try {
      const config = {
        headers: { Authorization: authHeader },
      };

      let response;
      if (method === 'get') {
        response = await firstValueFrom(this.httpService.get(url, config));
      } else if (method === 'post') {
        response = await firstValueFrom(this.httpService.post(url, data, config));
      } else if (method === 'patch') {
        response = await firstValueFrom(this.httpService.patch(url, data, config));
      } else if (method === 'delete') {
        response = await firstValueFrom(this.httpService.delete(url, config));
      }

      return response?.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data?.message || 'RBAC service error';
      throw new HttpException(
        {
          success: false,
          message,
          error: error.response?.data?.error,
        },
        status,
      );
    }
    throw new HttpException(
      {
        success: false,
        message: 'Internal server error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
