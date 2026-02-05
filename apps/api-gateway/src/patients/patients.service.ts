import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class PatientsService {
  constructor(private readonly httpService: HttpService) {}

  // ==================== Patient CRUD ====================

  async create(createPatientDto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/patients', createPatientDto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAll(query: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('/patients', {
          headers: { Authorization: authHeader },
          params: query,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async validateChi(chi: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/patients/validate-chi/${chi}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findByChiNumber(chi: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/patients/chi/${chi}`, {
          headers: { Authorization: authHeader },
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
        this.httpService.get(`/patients/${id}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(id: string, updatePatientDto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/patients/${id}`, updatePatientDto, {
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
        this.httpService.post(`/patients/${id}/deactivate`, {}, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async reactivate(id: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/patients/${id}/reactivate`, {}, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Next of Kin ====================

  async addNextOfKin(patientId: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/patients/${patientId}/next-of-kin`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllNextOfKin(patientId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/patients/${patientId}/next-of-kin`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateNextOfKin(
    patientId: string,
    nokId: string,
    dto: Record<string, any>,
    authHeader: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/patients/${patientId}/next-of-kin/${nokId}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async removeNextOfKin(patientId: string, nokId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`/patients/${patientId}/next-of-kin/${nokId}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Medical History ====================

  async addMedicalHistory(patientId: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/patients/${patientId}/medical-history`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllMedicalHistory(patientId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/patients/${patientId}/medical-history`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateMedicalHistory(
    patientId: string,
    historyId: string,
    dto: Record<string, any>,
    authHeader: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/patients/${patientId}/medical-history/${historyId}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async removeMedicalHistory(patientId: string, historyId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`/patients/${patientId}/medical-history/${historyId}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Allergies ====================

  async addAllergy(patientId: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/patients/${patientId}/allergies`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllAllergies(patientId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/patients/${patientId}/allergies`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateAllergy(
    patientId: string,
    allergyId: string,
    dto: Record<string, any>,
    authHeader: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/patients/${patientId}/allergies/${allergyId}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async removeAllergy(patientId: string, allergyId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`/patients/${patientId}/allergies/${allergyId}`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== Medical Aid ====================

  async addMedicalAid(patientId: string, dto: Record<string, any>, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/patients/${patientId}/medical-aid`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllMedicalAid(patientId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/patients/${patientId}/medical-aid`, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateMedicalAid(
    patientId: string,
    medicalAidId: string,
    dto: Record<string, any>,
    authHeader: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`/patients/${patientId}/medical-aid/${medicalAidId}`, dto, {
          headers: { Authorization: authHeader },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async removeMedicalAid(patientId: string, medicalAidId: string, authHeader: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`/patients/${patientId}/medical-aid/${medicalAidId}`, {
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
      const message = error.response?.data?.message || 'Patient service error';
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
      {
        success: false,
        message: 'Internal server error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
