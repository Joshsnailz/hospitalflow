import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';
import {
  CreateHospitalDto,
  UpdateHospitalDto,
  HospitalFilterDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateWardDto,
  UpdateWardDto,
  CreateBedDto,
  UpdateBedDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { ROLES } from '../config/roles.config';

@ApiTags('hospitals')
@ApiBearerAuth('JWT-auth')
@Controller('hospitals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  // ==================== Hospital CRUD ====================

  @Post()
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiOperation({ summary: 'Create a new hospital' })
  @ApiResponse({ status: 201, description: 'Hospital created successfully' })
  @ApiResponse({ status: 409, description: 'Hospital with this name already exists' })
  async createHospital(
    @Body() createHospitalDto: CreateHospitalDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const hospital = await this.hospitalsService.createHospital(
      createHospitalDto,
      currentUserId,
    );
    return {
      success: true,
      message: 'Hospital created successfully',
      data: hospital,
    };
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats() {
    const stats = await this.hospitalsService.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all hospitals with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Hospitals retrieved successfully' })
  async findAllHospitals(@Query() filterDto: HospitalFilterDto) {
    const result = await this.hospitalsService.findAllHospitals(filterDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hospital by ID' })
  @ApiParam({ name: 'id', description: 'Hospital UUID' })
  @ApiResponse({ status: 200, description: 'Hospital retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  async findOneHospital(@Param('id', ParseUUIDPipe) id: string) {
    const hospital = await this.hospitalsService.findOneHospital(id);
    return {
      success: true,
      data: hospital,
    };
  }

  @Patch(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiOperation({ summary: 'Update hospital' })
  @ApiParam({ name: 'id', description: 'Hospital UUID' })
  @ApiResponse({ status: 200, description: 'Hospital updated successfully' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  async updateHospital(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHospitalDto: UpdateHospitalDto,
  ) {
    const hospital = await this.hospitalsService.updateHospital(id, updateHospitalDto);
    return {
      success: true,
      message: 'Hospital updated successfully',
      data: hospital,
    };
  }

  // ==================== Department CRUD ====================

  @Post(':hospitalId/departments')
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiOperation({ summary: 'Create a new department in a hospital' })
  @ApiParam({ name: 'hospitalId', description: 'Hospital UUID' })
  @ApiResponse({ status: 201, description: 'Department created successfully' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  @ApiResponse({ status: 409, description: 'Department already exists in this hospital' })
  async createDepartment(
    @Param('hospitalId', ParseUUIDPipe) hospitalId: string,
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    createDepartmentDto.hospitalId = hospitalId;
    const department = await this.hospitalsService.createDepartment(
      createDepartmentDto,
      currentUserId,
    );
    return {
      success: true,
      message: 'Department created successfully',
      data: department,
    };
  }

  @Get(':hospitalId/departments')
  @ApiOperation({ summary: 'Get all departments for a hospital' })
  @ApiParam({ name: 'hospitalId', description: 'Hospital UUID' })
  @ApiResponse({ status: 200, description: 'Departments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  async findDepartmentsByHospital(
    @Param('hospitalId', ParseUUIDPipe) hospitalId: string,
  ) {
    const departments = await this.hospitalsService.findDepartmentsByHospital(hospitalId);
    return {
      success: true,
      data: departments,
    };
  }
}

@ApiTags('departments')
@ApiBearerAuth('JWT-auth')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Patch(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiOperation({ summary: 'Update department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Department updated successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async updateDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const department = await this.hospitalsService.updateDepartment(id, updateDepartmentDto);
    return {
      success: true,
      message: 'Department updated successfully',
      data: department,
    };
  }

  @Post(':departmentId/wards')
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiOperation({ summary: 'Create a new ward in a department' })
  @ApiParam({ name: 'departmentId', description: 'Department UUID' })
  @ApiResponse({ status: 201, description: 'Ward created successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 409, description: 'Ward already exists in this department' })
  async createWard(
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Body() createWardDto: CreateWardDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    createWardDto.departmentId = departmentId;
    const ward = await this.hospitalsService.createWard(
      createWardDto,
      currentUserId,
    );
    return {
      success: true,
      message: 'Ward created successfully',
      data: ward,
    };
  }

  @Get(':departmentId/wards')
  @ApiOperation({ summary: 'Get all wards for a department' })
  @ApiParam({ name: 'departmentId', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Wards retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async findWardsByDepartment(
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
  ) {
    const wards = await this.hospitalsService.findWardsByDepartment(departmentId);
    return {
      success: true,
      data: wards,
    };
  }
}

@ApiTags('wards')
@ApiBearerAuth('JWT-auth')
@Controller('wards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WardsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Patch(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiOperation({ summary: 'Update ward' })
  @ApiParam({ name: 'id', description: 'Ward UUID' })
  @ApiResponse({ status: 200, description: 'Ward updated successfully' })
  @ApiResponse({ status: 404, description: 'Ward not found' })
  async updateWard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWardDto: UpdateWardDto,
  ) {
    const ward = await this.hospitalsService.updateWard(id, updateWardDto);
    return {
      success: true,
      message: 'Ward updated successfully',
      data: ward,
    };
  }

  @Post(':wardId/beds')
  @Roles(ROLES.SUPER_ADMIN, ROLES.CLINICAL_ADMIN)
  @ApiOperation({ summary: 'Create a new bed in a ward' })
  @ApiParam({ name: 'wardId', description: 'Ward UUID' })
  @ApiResponse({ status: 201, description: 'Bed created successfully' })
  @ApiResponse({ status: 404, description: 'Ward not found' })
  @ApiResponse({ status: 409, description: 'Bed already exists in this ward' })
  async createBed(
    @Param('wardId', ParseUUIDPipe) wardId: string,
    @Body() createBedDto: CreateBedDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    createBedDto.wardId = wardId;
    const bed = await this.hospitalsService.createBed(
      createBedDto,
      currentUserId,
    );
    return {
      success: true,
      message: 'Bed created successfully',
      data: bed,
    };
  }

  @Get(':wardId/beds')
  @ApiOperation({ summary: 'Get all beds for a ward' })
  @ApiParam({ name: 'wardId', description: 'Ward UUID' })
  @ApiResponse({ status: 200, description: 'Beds retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ward not found' })
  async findBedsByWard(
    @Param('wardId', ParseUUIDPipe) wardId: string,
  ) {
    const beds = await this.hospitalsService.findBedsByWard(wardId);
    return {
      success: true,
      data: beds,
    };
  }
}

@ApiTags('beds')
@ApiBearerAuth('JWT-auth')
@Controller('beds')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BedsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get('available')
  @ApiOperation({ summary: 'Get available beds with optional filters' })
  @ApiResponse({ status: 200, description: 'Available beds retrieved successfully' })
  async findAvailableBeds(
    @Query('hospitalId') hospitalId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('wardId') wardId?: string,
  ) {
    const beds = await this.hospitalsService.findAvailableBeds(hospitalId, departmentId, wardId);
    return {
      success: true,
      data: beds,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update bed status' })
  @ApiParam({ name: 'id', description: 'Bed UUID' })
  @ApiResponse({ status: 200, description: 'Bed status updated successfully' })
  @ApiResponse({ status: 404, description: 'Bed not found' })
  @ApiResponse({ status: 400, description: 'Invalid bed status' })
  async updateBedStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBedDto: UpdateBedDto,
  ) {
    const bed = await this.hospitalsService.updateBedStatus(
      id,
      updateBedDto.status ?? 'available',
      updateBedDto.currentPatientId,
    );
    return {
      success: true,
      message: 'Bed status updated successfully',
      data: bed,
    };
  }
}
