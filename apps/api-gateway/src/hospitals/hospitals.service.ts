import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class HospitalsService {
  constructor(private readonly httpService: HttpService) {}

  // ==================== Hospitals ====================

  async createHospital(dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/hospitals', dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllHospitals(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/hospitals', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOneHospital(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/hospitals/${id}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateHospital(id: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/hospitals/${id}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteHospital(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`/hospitals/${id}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Departments ====================

  async createDepartment(hospitalId: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/hospitals/${hospitalId}/departments`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllDepartments(hospitalId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/hospitals/${hospitalId}/departments`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateDepartment(hospitalId: string, deptId: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/hospitals/${hospitalId}/departments/${deptId}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteDepartment(hospitalId: string, deptId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`/hospitals/${hospitalId}/departments/${deptId}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Wards ====================

  async createWard(hospitalId: string, deptId: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/hospitals/${hospitalId}/departments/${deptId}/wards`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllWards(hospitalId: string, deptId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/hospitals/${hospitalId}/departments/${deptId}/wards`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateWard(hospitalId: string, deptId: string, wardId: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/hospitals/${hospitalId}/departments/${deptId}/wards/${wardId}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteWard(hospitalId: string, deptId: string, wardId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`/hospitals/${hospitalId}/departments/${deptId}/wards/${wardId}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Beds ====================

  async createBed(wardId: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/wards/${wardId}/beds`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllBeds(wardId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/wards/${wardId}/beds`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateBed(wardId: string, bedId: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/wards/${wardId}/beds/${bedId}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteBed(wardId: string, bedId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`/wards/${wardId}/beds/${bedId}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Available Beds & Bed Status ====================

  async findAvailableBeds(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/beds/available', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateBedStatus(bedId: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/beds/${bedId}/status`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDashboardStats(authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/hospitals/dashboard/stats', {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Stats ====================

  async getStats(authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/hospitals/stats', {
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
      const message = error.response?.data?.message || 'Hospital service error';
      throw new HttpException(
        {
          success: false,
          message,
          error: error.response?.data?.error,
          errors: error.response?.data?.errors,
        },
        status,
      );
    }
    throw new HttpException(
      { success: false, message: 'Internal server error' },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
