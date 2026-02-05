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

  // Auth Metrics
  public readonly loginAttemptsTotal: client.Counter<string>;
  public readonly loginFailuresTotal: client.Counter<string>;
  public readonly activeSessionsTotal: client.Gauge<string>;
  public readonly tokenRefreshTotal: client.Counter<string>;

  // RabbitMQ Metrics
  public readonly rabbitMQPublishedTotal: client.Counter<string>;
  public readonly rabbitMQPublishErrors: client.Counter<string>;

  constructor(private readonly configService: ConfigService) {
    this.serviceName = this.configService.get('SERVICE_NAME', 'auth-service');
    this.registry = new client.Registry();

    this.registry.setDefaultLabels({
      service: this.serviceName,
    });

    // Collect default metrics
    client.collectDefaultMetrics({ register: this.registry });

    // HTTP Metrics
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

    // Auth Metrics
    this.loginAttemptsTotal = new client.Counter({
      name: 'auth_login_attempts_total',
      help: 'Total number of login attempts',
      labelNames: ['result'],
      registers: [this.registry],
    });

    this.loginFailuresTotal = new client.Counter({
      name: 'auth_login_failures_total',
      help: 'Total number of failed login attempts',
      labelNames: ['reason'],
      registers: [this.registry],
    });

    this.activeSessionsTotal = new client.Gauge({
      name: 'auth_active_sessions_total',
      help: 'Total number of active user sessions',
      registers: [this.registry],
    });

    this.tokenRefreshTotal = new client.Counter({
      name: 'auth_token_refresh_total',
      help: 'Total number of token refresh requests',
      labelNames: ['result'],
      registers: [this.registry],
    });

    // RabbitMQ Metrics
    this.rabbitMQPublishedTotal = new client.Counter({
      name: 'rabbitmq_messages_published_total',
      help: 'Total number of messages published to RabbitMQ',
      labelNames: ['exchange', 'routing_key'],
      registers: [this.registry],
    });

    this.rabbitMQPublishErrors = new client.Counter({
      name: 'rabbitmq_publish_errors_total',
      help: 'Total number of RabbitMQ publish errors',
      labelNames: ['exchange', 'routing_key'],
      registers: [this.registry],
    });
  }

  async onModuleInit() {
    // Initialize any default values if needed
  }

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

  recordLoginAttempt(success: boolean, failureReason?: string): void {
    this.loginAttemptsTotal.inc({ result: success ? 'success' : 'failure' });
    if (!success && failureReason) {
      this.loginFailuresTotal.inc({ reason: failureReason });
    }
  }

  recordTokenRefresh(success: boolean): void {
    this.tokenRefreshTotal.inc({ result: success ? 'success' : 'failure' });
  }

  recordRabbitMQPublish(exchange: string, routingKey: string, success: boolean): void {
    if (success) {
      this.rabbitMQPublishedTotal.inc({ exchange, routing_key: routingKey });
    } else {
      this.rabbitMQPublishErrors.inc({ exchange, routing_key: routingKey });
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
