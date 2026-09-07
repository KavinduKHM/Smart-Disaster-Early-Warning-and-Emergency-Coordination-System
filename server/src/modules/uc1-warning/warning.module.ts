import { Module } from '@nestjs/common';
import { WarningController } from './warning.controller';
import { WarningService } from './warning.service';

@Module({
  controllers: [WarningController],
  providers: [WarningService],
})
export class WarningModule {}
