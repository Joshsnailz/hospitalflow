import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3100',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Clinical Service API')
    .setDescription('Clinical Portal 2.0 Clinical Management Service')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
      'JWT-auth',
    )
    .addTag('encounters', 'Encounter management endpoints')
    .addTag('appointments', 'Appointment management endpoints')
    .addTag('discharge', 'Discharge form management endpoints')
    .addTag('imaging', 'Imaging request management endpoints')
    .addTag('controlled-drugs', 'Controlled drugs register endpoints')
    .addTag('emergency', 'Emergency visit management endpoints')
    .addTag('care-plans', 'Care plan management endpoints')
    .addTag('dashboard', 'Aggregated dashboard endpoints')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Clinical Service API Documentation',
  });

  const port = process.env.PORT || 3006;
  await app.listen(port);
  console.log(`Clinical Service is running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
