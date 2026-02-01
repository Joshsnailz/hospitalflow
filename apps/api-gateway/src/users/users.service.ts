import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class UsersService {
  constructor(private readonly httpService: HttpService) {}

  async findAll(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/users', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOne(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/users/${id}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async create(createUserDto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/users', createUserDto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(id: string, updateUserDto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/users/${id}`, updateUserDto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateRole(id: string, updateRoleDto: { role: string }, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/users/${id}/role`, updateRoleDto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async activate(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/users/${id}/activate`, {}, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deactivate(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/users/${id}/deactivate`, {}, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async remove(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`/users/${id}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getAvailableRoles(authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/users/roles', {
          headers: { Authorization: authHeader },
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
      const message = error.response?.data?.message || 'User service error';
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
