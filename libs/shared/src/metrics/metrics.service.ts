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
  public readonly httpRequestsInProgress: client.Gauge<string>;

  // Business Metrics
  public readonly auditLogsTotal: client.Counter<string>;
  public readonly usersTotal: client.Gauge<string>;
  public readonly activeSessionsTotal: client.Gauge<string>;
  public readonly loginAttemptsTotal: client.Counter<string>;
  public readonly loginFailuresTotal: client.Counter<string>;

  // RabbitMQ Metrics
  public readonly rabbitMQPublishedTotal: client.Counter<string>;
  public readonly rabbitMQPublishErrors: client.Counter<string>;
  public readonly rabbitMQConsumedTotal: client.Counter<string>;

  // Database Metrics
  public readonly dbQueryDuration: client.Histogram<string>;
  public readonly dbConnectionsActive: client.Gauge<string>;

  constructor(private readonly configService: ConfigService) {
    this.serviceName = this.configService.get('SERVICE_NAME', 'unknown-service');
    this.registry = new client.Registry();

    // Set default labels
    this.registry.setDefaultLabels({
      service: this.serviceName,
    });

    // Collect default metrics (CPU, memory, event loop, etc.)
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

    this.httpRequestsInProgress = new client.Gauge({
      name: 'http_requests_in_progress',
      help: 'Number of HTTP requests currently in progress',
      labelNames: ['method', 'path'],
      registers: [this.registry],
    });

    // Business Metrics
    this.auditLogsTotal = new client.Counter({
      name: 'audit_logs_total',
      help: 'Total number of audit logs created',
      labelNames: ['action', 'resource', 'status'],
      registers: [this.registry],
    });

    this.usersTotal = new client.Gauge({
      name: 'users_total',
      help: 'Total number of users in the system',
      labelNames: ['role', 'status'],
      registers: [this.registry],
    });

    this.activeSessionsTotal = new client.Gauge({
      name: 'active_sessions_total',
      help: 'Total number of active user sessions',
      registers: [this.registry],
    });

    this.loginAttemptsTotal = new client.Counter({
      name: 'auth_login_attempts_total',
      help: 'Total number of login attempts',
      registers: [this.registry],
    });

    this.loginFailuresTotal = new client.Counter({
      name: 'auth_login_failures_total',
      help: 'Total number of failed login attempts',
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

    this.rabbitMQConsumedTotal = new client.Counter({
      name: 'rabbitmq_messages_consumed_total',
      help: 'Total number of messages consumed from RabbitMQ',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    // Database Metrics
    this.dbQueryDuration = new client.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
      registers: [this.registry],
    });

    this.dbConnectionsActive = new client.Gauge({
      name: 'db_connections_active',
      help: 'Number of active database connections',
      registers: [this.registry],
    });
  }

  async onModuleInit() {
    // Initialize any default values if needed
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get content type for metrics endpoint
   */
  getContentType(): string {
    return this.registry.contentType;
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, path: string, status: number, durationMs: number): void {
    const normalizedPath = this.normalizePath(path);
    this.httpRequestsTotal.inc({ method, path: normalizedPath, status: status.toString() });
    this.httpRequestDuration.observe(
      { method, path: normalizedPath, status: status.toString() },
      durationMs / 1000,
    );
  }

  /**
   * Start tracking an in-progress request
   */
  startHttpRequest(method: string, path: string): () => void {
    const normalizedPath = this.normalizePath(path);
    this.httpRequestsInProgress.inc({ method, path: normalizedPath });
    return () => {
      this.httpRequestsInProgress.dec({ method, path: normalizedPath });
    };
  }

  /**
   * Record audit log creation
   */
  recordAuditLog(action: string, resource: string, status: string): void {
    this.auditLogsTotal.inc({ action, resource, status });
  }

  /**
   * Record login attempt
   */
  recordLoginAttempt(success: boolean): void {
    this.loginAttemptsTotal.inc();
    if (!success) {
      this.loginFailuresTotal.inc();
    }
  }

  /**
   * Record RabbitMQ publish
   */
  recordRabbitMQPublish(exchange: string, routingKey: string, success: boolean): void {
    if (success) {
      this.rabbitMQPublishedTotal.inc({ exchange, routing_key: routingKey });
    } else {
      this.rabbitMQPublishErrors.inc({ exchange, routing_key: routingKey });
    }
  }

  /**
   * Record RabbitMQ consume
   */
  recordRabbitMQConsume(queue: string): void {
    this.rabbitMQConsumedTotal.inc({ queue });
  }

  /**
   * Record database query
   */
  recordDbQuery(operation: string, table: string, durationMs: number): void {
    this.dbQueryDuration.observe({ operation, table }, durationMs / 1000);
  }

  /**
   * Normalize path for metrics (replace dynamic segments)
   */
  private normalizePath(path: string): string {
    // Replace UUIDs
    let normalized = path.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id',
    );
    // Replace numeric IDs
    normalized = normalized.replace(/\/\d+/g, '/:id');
    // Remove query strings
    normalized = normalized.split('?')[0];
    return normalized;
  }
}
