// backend/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuração global de validação de DTO
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  // Configuração CORS
  app.enableCors();
  
  // Configuração Swagger
  const config = new DocumentBuilder()
    .setTitle('API Spartakus')
    .setDescription('API do Sistema Spartakus')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('usuarios')
    .addTag('motoristas')
    .addTag('veiculos')
    .addTag('proprietarios')
    .addTag('empresas')
    .addTag('consultas')
    .addTag('anexos')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(3001);
}
bootstrap();