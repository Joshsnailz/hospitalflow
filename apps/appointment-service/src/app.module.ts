import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { EventsModule } from './events/events.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';
import { RoundRobinModule } from './round-robin/round-robin.module';
import { RescheduleRequestsModule } from './reschedule-requests/reschedule-requests.module';
import { AppointmentEntity } from './appointments/entities/appointment.entity';
import { ClinicianAvailabilityEntity } from './availability/entities/clinician-availability.entity';
import { RoundRobinTrackerEntity } from './round-robin/entities/round-robin-tracker.entity';
import { RescheduleRequestEntity } from './reschedule-requests/entities/reschedule-request.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('APPOINTMENT_DB_HOST', 'localhost'),
        port: configService.get('APPOINTMENT_DB_PORT', 5432),
        username: configService.get('APPOINTMENT_DB_USER', 'postgres'),
        password: configService.get('APPOINTMENT_DB_PASSWORD', ''),
        database: configService.get('APPOINTMENT_DB_NAME', 'appointment_db'),
        entities: [
          AppointmentEntity,
          ClinicianAvailabilityEntity,
          RoundRobinTrackerEntity,
          RescheduleRequestEntity,
        ],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    HealthModule,
    MetricsModule,
    EventsModule,
    AppointmentsModule,
    AvailabilityModule,
    RoundRobinModule,
    RescheduleRequestsModule,
  ],
})
export class AppModule {}
