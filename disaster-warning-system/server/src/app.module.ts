import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { SharedModule } from './modules/shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { WarningModule } from './modules/uc1-warning/warning.module';
import { ReportModule } from './modules/uc2-reports/report.module';
import { RescueModule } from './modules/uc3-rescue/rescue.module';
import { ReliefModule } from './modules/uc4-relief/relief.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

let memServerPromise: Promise<string> | null = null;

async function resolveMongoUri(): Promise<string> {
  const envUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (envUri && !envUri.includes('user:pass@cluster0')) {
    return envUri;
  }

  // Spin up MongoMemoryServer dynamically if no working cloud/local URI is provided
  if (!memServerPromise) {
    memServerPromise = (async () => {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        console.log('=======================================================');
        console.log('⚡ Dynamic In-Memory MongoDB Started Automatically!');
        console.log(`URI: ${uri}`);
        console.log('=======================================================');
        return uri;
      } catch (err) {
        console.warn('Falling back to local 127.0.0.1:27017');
        return 'mongodb://127.0.0.1:27017/disaster_db';
      }
    })();
  }

  return memServerPromise;
}

@Module({
  imports: [
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
