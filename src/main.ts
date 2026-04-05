// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with more specific configuration
  app.enableCors({
    origin: 'http://localhost:3000', // Your Next.js frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  // Global prefix (optional)
  // app.setGlobalPrefix('api');
  
  await app.listen(process.env.PORT ?? 8000);
  console.log(`Backend running on http://localhost:${process.env.PORT ?? 8000}`);
}
bootstrap();