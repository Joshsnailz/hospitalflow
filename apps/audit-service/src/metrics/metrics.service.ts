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

  // Audit Metrics
  public readonly auditLogsTotal: client.Counter<string>;
  public readonly dataAccessLogsTotal: client.Counter<string>;

  // RabbitMQ Metrics
  public readonly rabbitMQConsumedTotal: client.Counter<string>;
  public readonly rabbitMQConsumeErrors: client.Counter<string>;

  constructor(private readonly configService: ConfigService) {
    this.serviceName = this.configService.get('SERVICE_NAME', 'audit-service');
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

    this.auditLogsTotal = new client.Counter({
      name: 'audit_logs_total',
      help: 'Total number of audit logs created',
      labelNames: ['action', 'resource', 'status'],
      registers: [this.registry],
    });

    this.dataAccessLogsTotal = new client.Counter({
      name: 'data_access_logs_total',
      help: 'Total number of data access logs created',
      labelNames: ['access_type', 'data_type', 'sensitivity'],
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

  recordAuditLog(action: string, resource: string, status: string): void {
    this.auditLogsTotal.inc({ action, resource, status });
  }

  recordDataAccessLog(accessType: string, dataType: string, sensitivity: string): void {
    this.dataAccessLogsTotal.inc({ access_type: accessType, data_type: dataType, sensitivity });
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
