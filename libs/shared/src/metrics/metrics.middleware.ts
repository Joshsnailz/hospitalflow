import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Skip metrics endpoint to avoid recursion
    if (req.path === '/metrics') {
      return next();
    }

    const startTime = Date.now();
    const endRequest = this.metricsService.startHttpRequest(req.method, req.path);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      endRequest();
      this.metricsService.recordHttpRequest(
        req.method,
        req.path,
        res.statusCode,
        duration,
      );
    });

    next();
  }
}
