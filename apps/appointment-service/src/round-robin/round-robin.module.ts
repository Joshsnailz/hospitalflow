import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoundRobinTrackerEntity } from './entities/round-robin-tracker.entity';
import { RoundRobinService } from './round-robin.service';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoundRobinTrackerEntity]),
    AvailabilityModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get('AUTH_SERVICE_URL', 'http://localhost:3001'),
        timeout: 10000,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RoundRobinService],
  exports: [RoundRobinService],
})
export class RoundRobinModule {}
