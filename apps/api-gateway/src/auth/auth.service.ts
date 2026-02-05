import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class AuthService {
  constructor(private readonly httpService: HttpService) {}

  async login(loginDto: { email: string; password: string }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/auth/login', loginDto),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async register(registerDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/auth/register', registerDto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async refresh(refreshTokenDto: { refreshToken: string }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/auth/refresh', refreshTokenDto),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async logout(authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/auth/logout', {}, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMe(authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/auth/me', {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Admin user management
  async createUserAdmin(createUserDto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/auth/admin/users', createUserDto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllUsers(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/auth/admin/users', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async activateUser(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/auth/admin/users/${id}/activate`, {}, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deactivateUser(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/auth/admin/users/${id}/deactivate`, {}, {
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
      const message = error.response?.data?.message || 'Auth service error';
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
