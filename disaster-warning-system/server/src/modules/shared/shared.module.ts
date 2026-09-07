import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  exports: [DatabaseModule, ConfigModule],
})
export class SharedModule {}
