import { Module } from '@nestjs/common';
import { RescueController } from './rescue.controller';
import { RescueService } from './rescue.service';

@Module({
  controllers: [RescueController],
  providers: [RescueService],
})
export class RescueModule {}
