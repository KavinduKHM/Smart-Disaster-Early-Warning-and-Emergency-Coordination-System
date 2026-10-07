import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { SharedModule } from './modules/shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { WarningModule } from './modules/uc1-warning/warning.module';
import { ReportModule } from './modules/uc2-reports/report.module';
import { RescueModule } from './modules/uc3-rescue/rescue.module';
import { ReliefModule } from './modules/uc4-relief/relief.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

dotenv.config();

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb+srv://user:pass@cluster0.j5gvtgv.mongodb.net/?appName=Cluster0';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    MongooseModule.forRoot(mongoUri),
    SharedModule,
    AuthModule,
    WarningModule,
    ReportModule,
    RescueModule,
    ReliefModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
