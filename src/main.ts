import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// Sin estas variables la app no puede funcionar: mejor fallar al arrancar con un mensaje claro
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];

function assertRequiredEnv() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')} (see .env.example)`);
  }
}

// CORS_ORIGIN admite varios orígenes separados por coma (ej: la URL de Vercel y localhost)
function corsOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

async function bootstrap() {
  assertRequiredEnv();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: corsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
  new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 8080;
  await app.listen(port);
  new Logger('Bootstrap').log(`Listening on port ${port} (CORS: ${corsOrigins().join(', ')})`);
}
bootstrap();
