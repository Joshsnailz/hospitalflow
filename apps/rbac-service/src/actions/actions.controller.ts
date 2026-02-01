import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { ActionsService } from './actions.service';
import { CreateActionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';

@ApiTags('actions')
@ApiBearerAuth()
@Controller('actions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new action' })
  @ApiResponse({ status: 201, description: 'Action created successfully' })
  @ApiResponse({ status: 409, description: 'Action already exists' })
  async create(@Body() createActionDto: CreateActionDto) {
    const action = await this.actionsService.create(createActionDto);
    return {
      success: true,
      message: 'Action created successfully',
      data: action,
    };
  }

  @Get()
  @Roles('clinical_admin')
  @ApiOperation({ summary: 'Get all actions' })
  @ApiResponse({ status: 200, description: 'Actions retrieved successfully' })
  async findAll() {
    const actions = await this.actionsService.findAll();
    return {
      success: true,
      data: actions,
    };
  }

  @Get(':id')
  @Roles('clinical_admin')
  @ApiOperation({ summary: 'Get action by ID' })
  @ApiParam({ name: 'id', description: 'Action UUID' })
  @ApiResponse({ status: 200, description: 'Action retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Action not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const action = await this.actionsService.findOne(id);
    return {
      success: true,
      data: action,
    };
  }
}
