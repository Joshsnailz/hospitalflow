import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: client.Registry;
  private readonly serviceName: string;

  // HTTP Metrics
  public readonly httpRequestsTotal: client.Counter<string>;
  public readonly httpRequestDuration: client.Histogram<string>;

  // User Metrics
  public readonly usersTotal: client.Gauge<string>;
  public readonly userOperationsTotal: client.Counter<string>;

  // RabbitMQ Metrics
  public readonly rabbitMQConsumedTotal: client.Counter<string>;
  public readonly rabbitMQConsumeErrors: client.Counter<string>;

  constructor(private readonly configService: ConfigService) {
    this.serviceName = this.configService.get('SERVICE_NAME', 'user-service');
    this.registry = new client.Registry();

    this.registry.setDefaultLabels({
      service: this.serviceName,
    });

    client.collectDefaultMetrics({ register: this.registry });

    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.usersTotal = new client.Gauge({
      name: 'users_total',
      help: 'Total number of users in the system',
      labelNames: ['role', 'status'],
      registers: [this.registry],
    });

    this.userOperationsTotal = new client.Counter({
      name: 'user_operations_total',
      help: 'Total number of user operations',
      labelNames: ['operation', 'result'],
      registers: [this.registry],
    });

    this.rabbitMQConsumedTotal = new client.Counter({
      name: 'rabbitmq_messages_consumed_total',
      help: 'Total number of messages consumed from RabbitMQ',
      labelNames: ['queue', 'result'],
      registers: [this.registry],
    });

    this.rabbitMQConsumeErrors = new client.Counter({
      name: 'rabbitmq_consume_errors_total',
      help: 'Total number of RabbitMQ consume errors',
      labelNames: ['queue'],
      registers: [this.registry],
    });
  }

  async onModuleInit() {}

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  recordHttpRequest(method: string, path: string, status: number, durationMs: number): void {
    const normalizedPath = this.normalizePath(path);
    this.httpRequestsTotal.inc({ method, path: normalizedPath, status: status.toString() });
    this.httpRequestDuration.observe(
      { method, path: normalizedPath, status: status.toString() },
      durationMs / 1000,
    );
  }

  recordUserOperation(operation: string, success: boolean): void {
    this.userOperationsTotal.inc({ operation, result: success ? 'success' : 'failure' });
  }

  recordRabbitMQConsume(queue: string, success: boolean): void {
    if (success) {
      this.rabbitMQConsumedTotal.inc({ queue, result: 'success' });
    } else {
      this.rabbitMQConsumeErrors.inc({ queue });
    }
  }

  private normalizePath(path: string): string {
    let normalized = path.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id',
    );
    normalized = normalized.replace(/\/\d+/g, '/:id');
    normalized = normalized.split('?')[0];
    return normalized;
  }
}
