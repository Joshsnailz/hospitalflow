import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RescheduleRequestsService } from './reschedule-requests.service';
import { ResolveRescheduleRequestDto } from './dto/resolve-reschedule-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { CLINICAL_ACCESS_ROLES, ADMIN_ROLES } from '../config/roles.config';

@ApiTags('reschedule-requests')
@ApiBearerAuth('JWT-auth')
@Controller('reschedule-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RescheduleRequestsController {
  constructor(private readonly rescheduleRequestsService: RescheduleRequestsService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List pending reschedule requests' })
  @ApiResponse({ status: 200, description: 'Requests retrieved' })
  async findPending() {
    const data = await this.rescheduleRequestsService.findPending();
    return { success: true, data };
  }

  @Get('appointment/:id')
  @Roles(...CLINICAL_ACCESS_ROLES)
  @ApiOperation({ summary: 'Get reschedule requests for an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Requests retrieved' })
  async findByAppointment(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.rescheduleRequestsService.findByAppointment(id);
    return { success: true, data };
  }

  @Post(':id/resolve')
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject a reschedule request' })
  @ApiParam({ name: 'id', description: 'Reschedule Request UUID' })
  @ApiResponse({ status: 200, description: 'Request resolved' })
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveRescheduleRequestDto,
    @CurrentUser() currentUser: { id: string; email: string; role: string },
  ) {
    const data = await this.rescheduleRequestsService.resolve(id, dto, currentUser);
    return {
      success: true,
      message: `Reschedule request ${dto.resolution}`,
      data,
    };
  }
}
