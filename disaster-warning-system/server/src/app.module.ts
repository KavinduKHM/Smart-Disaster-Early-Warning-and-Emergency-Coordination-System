import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { SharedModule } from './modules/shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { WarningModule } from './modules/uc1-warning/warning.module';
import { ReportModule } from './modules/uc2-reports/report.module';
import { RescueModule } from './modules/uc3-rescue/rescue.module';
import { ReliefModule } from './modules/uc4-relief/relief.module';

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
    SharedModule,
    AuthModule,
    WarningModule,
    ReportModule,
    RescueModule,
    ReliefModule,
  ],
})
export class AppModule {}
