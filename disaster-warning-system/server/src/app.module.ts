import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as net from 'net';
import * as dns from 'dns';
import { SharedModule } from './modules/shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { WarningModule } from './modules/uc1-warning/warning.module';
import { ReportModule } from './modules/uc2-reports/report.module';
import { RescueModule } from './modules/uc3-rescue/rescue.module';
import { ReliefModule } from './modules/uc4-relief/relief.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

dotenv.config();

function isPortOpen(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

async function testMongoAtlasUri(uri: string): Promise<boolean> {
  return new Promise((resolve) => {
    const match = uri.match(/@([^/?]+)/);
    if (!match || !match[1]) return resolve(false);
    const host = match[1];

    dns.resolveSrv(`_mongodb._tcp.${host}`, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) return resolve(false);
      const targetHost = addresses[0].name;
      const targetPort = addresses[0].port || 27017;

      const socket = new net.Socket();
      socket.setTimeout(2500);
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('error', () => { socket.destroy(); resolve(false); });
      socket.once('timeout', () => { socket.destroy(); resolve(false); });
      socket.connect(targetPort, targetHost);
    });
  });
}

let memServerPromise: Promise<string> | null = null;

async function resolveMongoUri(configService?: ConfigService): Promise<string> {
  const envFileUri = configService?.get<string>('MONGODB_URI');
  const processUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const targetUri = envFileUri || processUri || '';

  if (targetUri && targetUri.startsWith('mongodb+srv://')) {
    const canConnectToAtlas = await testMongoAtlasUri(targetUri);
    if (canConnectToAtlas) {
      console.log(`✅ Connected to MongoDB Atlas URI: ${targetUri.replace(/:([^:@]+)@/, ':****@')}`);
      return targetUri;
    } else {
      console.warn(`⚠️ MongoDB Atlas cluster unreachable (IP address is not whitelisted on Atlas).`);
      console.warn(`⚡ Automatically falling back to local / in-memory MongoDB server for instant development!`);
    }
  } else if (targetUri && !targetUri.includes('user:pass@')) {
    return targetUri;
  }

  const isLocalRunning = await isPortOpen('127.0.0.1', 27017);
  if (isLocalRunning) {
    console.log('✅ Connected to local MongoDB daemon (mongodb://127.0.0.1:27017/disaster_warning)');
    return 'mongodb://127.0.0.1:27017/disaster_warning';
  }

  if (!memServerPromise) {
    memServerPromise = (async () => {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        console.log('=======================================================');
        console.log('⚡ Dynamic In-Memory MongoDB Server Started Automatically!');
        console.log(`URI: ${uri}`);
        console.log('=======================================================');
        return uri;
      } catch (err: any) {
        console.warn(`⚠️ Could not start MongoMemoryServer (${err.message}), fallback to local 27017`);
        return 'mongodb://127.0.0.1:27017/disaster_warning';
      }
    })();
  }

  return memServerPromise;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = await resolveMongoUri(configService);
        return {
          uri,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
        };
      },
    }),
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
