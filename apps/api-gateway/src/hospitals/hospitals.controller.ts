import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('hospitals')
@ApiBearerAuth()
@Controller('hospitals')
@UseGuards(JwtAuthGuard)
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  // ==================== Hospitals ====================

  @Post()
  async createHospital(
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.createHospital(dto, authHeader);
  }

  @Get()
  async findAllHospitals(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.findAllHospitals(query, authHeader);
  }

  @Get('beds/available')
  async findAvailableBeds(
    @Query() query: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.findAvailableBeds(query, authHeader);
  }

  @Patch('beds/:bedId/status')
  async updateBedStatus(
    @Param('bedId') bedId: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.updateBedStatus(bedId, dto, authHeader);
  }

  @Get('dashboard/stats')
  async getDashboardStats(
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.getDashboardStats(authHeader);
  }

  @Get('stats')
  async getStats(@Headers('authorization') authHeader: string) {
    return this.hospitalsService.getStats(authHeader);
  }

  // ==================== Departments ====================
  // IMPORTANT: Department routes BEFORE generic :id route to avoid conflicts

  @Post(':hospitalId/departments')
  async createDepartment(
    @Param('hospitalId') hospitalId: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.createDepartment(hospitalId, dto, authHeader);
  }

  @Get(':hospitalId/departments')
  async findAllDepartments(
    @Param('hospitalId') hospitalId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.findAllDepartments(hospitalId, authHeader);
  }

  @Patch(':hospitalId/departments/:deptId')
  async updateDepartment(
    @Param('hospitalId') hospitalId: string,
    @Param('deptId') deptId: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.updateDepartment(hospitalId, deptId, dto, authHeader);
  }

  @Delete(':hospitalId/departments/:deptId')
  async deleteDepartment(
    @Param('hospitalId') hospitalId: string,
    @Param('deptId') deptId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.deleteDepartment(hospitalId, deptId, authHeader);
  }

  // ==================== Wards ====================

  @Post(':hospitalId/departments/:deptId/wards')
  async createWard(
    @Param('hospitalId') hospitalId: string,
    @Param('deptId') deptId: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.createWard(hospitalId, deptId, dto, authHeader);
  }

  @Get(':hospitalId/departments/:deptId/wards')
  async findAllWards(
    @Param('hospitalId') hospitalId: string,
    @Param('deptId') deptId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.findAllWards(hospitalId, deptId, authHeader);
  }

  @Patch(':hospitalId/departments/:deptId/wards/:wardId')
  async updateWard(
    @Param('hospitalId') hospitalId: string,
    @Param('deptId') deptId: string,
    @Param('wardId') wardId: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.updateWard(hospitalId, deptId, wardId, dto, authHeader);
  }

  @Delete(':hospitalId/departments/:deptId/wards/:wardId')
  async deleteWard(
    @Param('hospitalId') hospitalId: string,
    @Param('deptId') deptId: string,
    @Param('wardId') wardId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.deleteWard(hospitalId, deptId, wardId, authHeader);
  }

  // ==================== Beds ====================

  @Post('wards/:wardId/beds')
  async createBed(
    @Param('wardId') wardId: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.createBed(wardId, dto, authHeader);
  }

  @Get('wards/:wardId/beds')
  async findAllBeds(
    @Param('wardId') wardId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.findAllBeds(wardId, authHeader);
  }

  @Patch('wards/:wardId/beds/:bedId')
  async updateBed(
    @Param('wardId') wardId: string,
    @Param('bedId') bedId: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.updateBed(wardId, bedId, dto, authHeader);
  }

  @Delete('wards/:wardId/beds/:bedId')
  async deleteBed(
    @Param('wardId') wardId: string,
    @Param('bedId') bedId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.deleteBed(wardId, bedId, authHeader);
  }

  // ==================== Generic Hospital Routes ====================
  // IMPORTANT: These generic :id routes are placed LAST to avoid route conflicts

  @Get(':id')
  async findOneHospital(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.findOneHospital(id, authHeader);
  }

  @Patch(':id')
  async updateHospital(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.updateHospital(id, dto, authHeader);
  }

  @Delete(':id')
  async deleteHospital(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.hospitalsService.deleteHospital(id, authHeader);
  }
}
