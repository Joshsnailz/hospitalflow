import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('healthcheck')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Audit Service is running healthy' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        service: { type: 'string', example: 'audit-service' },
      },
    },
  })
  healthCheck() {
    return {
      success: true,
      message: 'Audit Service is running healthy',
      timestamp: new Date().toISOString(),
      service: 'audit-service',
    };
  }
}
