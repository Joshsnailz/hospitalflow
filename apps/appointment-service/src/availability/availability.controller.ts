import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { CLINICAL_ACCESS_ROLES, ADMIN_ROLES } from '../config/roles.config';

@ApiTags('availability')
@ApiBearerAuth('JWT-auth')
@Controller('availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List all clinician availability' })
  @ApiResponse({ status: 200, description: 'Availability records retrieved' })
  async getAll() {
    const data = await this.availabilityService.getAll();
    return { success: true, data };
  }

  @Get('me')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get my availability' })
  @ApiResponse({ status: 200, description: 'My availability retrieved' })
  async getMyAvailability(@CurrentUser('id') clinicianId: string) {
    const data = await this.availabilityService.getMyAvailability(clinicianId);
    return { success: true, data };
  }

  @Get('available')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get currently available clinicians' })
  @ApiResponse({ status: 200, description: 'Available clinicians retrieved' })
  async getAvailable(
    @Query('hospitalId') hospitalId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const data = await this.availabilityService.getAvailable(hospitalId, departmentId);
    return { success: true, data };
  }

  @Patch('status')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Update my availability status' })
  @ApiResponse({ status: 200, description: 'Availability updated' })
  async updateStatus(
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser() currentUser: { id: string; email: string; role: string; firstName?: string; lastName?: string },
  ) {
    const data = await this.availabilityService.updateStatus(dto, currentUser);
    return {
      success: true,
      message: 'Availability updated successfully',
      data,
    };
  }
}
