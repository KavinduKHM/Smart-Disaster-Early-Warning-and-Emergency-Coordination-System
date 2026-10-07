import * as dns from 'dns';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

// Fix for Node.js querySrv ETIMEOUT on Windows/ISP networks
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`=======================================================`);
  console.log(`Disaster Early Warning System Server running on port ${port}`);
  console.log(`API Base URL: http://localhost:${port}/api`);
  console.log(`=======================================================`);
}

bootstrap();

