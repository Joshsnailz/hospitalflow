import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('healthcheck')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Service API Gateway is running healthy',
        },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        service: { type: 'string', example: 'api-gateway' },
      },
    },
  })
  healthCheck() {
    return {
      success: true,
      message: 'Service API Gateway is running healthy',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    };
  }
}
