import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserConsumerService } from './user-consumer.service';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UserEntity]),
  ],
  providers: [UserConsumerService],
  exports: [UserConsumerService],
})
export class EventsModule {}
