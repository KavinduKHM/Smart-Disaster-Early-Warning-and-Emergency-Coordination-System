import { Module } from '@nestjs/common';
import { ReliefController } from './relief.controller';
import { ReliefService } from './relief.service';

@Module({
  controllers: [ReliefController],
  providers: [ReliefService],
})
export class ReliefModule {}
