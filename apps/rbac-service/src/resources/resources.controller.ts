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
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';

@ApiTags('resources')
@ApiBearerAuth()
@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({ status: 201, description: 'Resource created successfully' })
  @ApiResponse({ status: 409, description: 'Resource already exists' })
  async create(@Body() createResourceDto: CreateResourceDto) {
    const resource = await this.resourcesService.create(createResourceDto);
    return {
      success: true,
      message: 'Resource created successfully',
      data: resource,
    };
  }

  @Get()
  @Roles('clinical_admin')
  @ApiOperation({ summary: 'Get all resources' })
  @ApiResponse({ status: 200, description: 'Resources retrieved successfully' })
  async findAll() {
    const resources = await this.resourcesService.findAll();
    return {
      success: true,
      data: resources,
    };
  }

  @Get(':id')
  @Roles('clinical_admin')
  @ApiOperation({ summary: 'Get resource by ID' })
  @ApiParam({ name: 'id', description: 'Resource UUID' })
  @ApiResponse({ status: 200, description: 'Resource retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const resource = await this.resourcesService.findOne(id);
    return {
      success: true,
      data: resource,
    };
  }
}
