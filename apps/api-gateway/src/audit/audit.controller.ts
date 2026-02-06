import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getAuditLogs(@Query() query: Record<string, any>, @Req() req: any) {
    try {
      return await this.auditService.getAuditLogs(query, req.headers.authorization);
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch audit logs',
        error.response?.status || 500,
      );
    }
  }

  @Get('statistics')
  async getStatistics(@Query() query: Record<string, any>, @Req() req: any) {
    try {
      return await this.auditService.getStatistics(query, req.headers.authorization);
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch audit statistics',
        error.response?.status || 500,
      );
    }
  }

  @Get('logs/:id')
  async getAuditLog(@Param('id') id: string, @Req() req: any) {
    try {
      return await this.auditService.getAuditLog(id, req.headers.authorization);
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch audit log',
        error.response?.status || 500,
      );
    }
  }

  @Get('user/:userId')
  async getUserAuditLogs(
    @Param('userId') userId: string,
    @Query() query: Record<string, any>,
    @Req() req: any,
  ) {
    try {
      return await this.auditService.getUserAuditLogs(userId, query, req.headers.authorization);
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch user audit logs',
        error.response?.status || 500,
      );
    }
  }

  @Get('data-access')
  async getDataAccessLogs(@Query() query: Record<string, any>, @Req() req: any) {
    try {
      return await this.auditService.getDataAccessLogs(query, req.headers.authorization);
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch data access logs',
        error.response?.status || 500,
      );
    }
  }

  @Get('patient/:patientId')
  async getPatientAccessLogs(
    @Param('patientId') patientId: string,
    @Query() query: Record<string, any>,
    @Req() req: any,
  ) {
    try {
      return await this.auditService.getPatientAccessLogs(patientId, query, req.headers.authorization);
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch patient access logs',
        error.response?.status || 500,
      );
    }
  }
}
