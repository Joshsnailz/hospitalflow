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

  // Appointment Metrics
  public readonly appointmentCreatedTotal: client.Counter<string>;
  public readonly appointmentAcceptedTotal: client.Counter<string>;
  public readonly appointmentCompletedTotal: client.Counter<string>;
  public readonly appointmentCancelledTotal: client.Counter<string>;
  public readonly rescheduleRequestsTotal: client.Counter<string>;

  // RabbitMQ Metrics
  public readonly rabbitMQPublishedTotal: client.Counter<string>;
  public readonly rabbitMQPublishErrors: client.Counter<string>;
  public readonly rabbitMQConsumedTotal: client.Counter<string>;

  constructor(private readonly configService: ConfigService) {
    this.serviceName = this.configService.get('SERVICE_NAME', 'appointment-service');
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

    this.appointmentCreatedTotal = new client.Counter({
      name: 'appointment_created_total',
      help: 'Total number of appointments created',
      labelNames: ['scenario', 'priority'],
      registers: [this.registry],
    });

    this.appointmentAcceptedTotal = new client.Counter({
      name: 'appointment_accepted_total',
      help: 'Total number of appointments accepted by clinicians',
      registers: [this.registry],
    });

    this.appointmentCompletedTotal = new client.Counter({
      name: 'appointment_completed_total',
      help: 'Total number of appointments completed',
      registers: [this.registry],
    });

    this.appointmentCancelledTotal = new client.Counter({
      name: 'appointment_cancelled_total',
      help: 'Total number of appointments cancelled',
      registers: [this.registry],
    });

    this.rescheduleRequestsTotal = new client.Counter({
      name: 'reschedule_requests_total',
      help: 'Total number of reschedule requests',
      labelNames: ['status'],
      registers: [this.registry],
    });

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
