import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { SharedModule } from './modules/shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { WarningModule } from './modules/uc1-warning/warning.module';
import { ReportModule } from './modules/uc2-reports/report.module';
import { RescueModule } from './modules/uc3-rescue/rescue.module';
import { ReliefModule } from './modules/uc4-relief/relief.module';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.warn('WARNING: MONGODB_URI is not set in environment variables! Please check your .env file.');
}

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri || ''),
    SharedModule,
    AuthModule,
    WarningModule,
    ReportModule,
    RescueModule,
    ReliefModule,
  ],
})
export class AppModule {}
