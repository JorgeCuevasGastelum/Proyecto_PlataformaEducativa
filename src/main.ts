import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { DominioExceptionFilter } from './comun/filtros/dominio.filter';
import { HttpExceptionFilter } from './comun/filtros/http.filter';
import { SobreInterceptor } from './comun/interceptores/sobre.interceptor';

async function bootstrap() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Falta JWT_SECRET (minimo 32 caracteres). Revisa el archivo .env');
  }

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(), new DominioExceptionFilter());
  app.useGlobalInterceptors(new SobreInterceptor());

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  const origenes = (process.env.ORIGENES_PERMITIDOS ?? 'http://localhost:5173').split(',').map((o) => o.trim());
  app.enableCors({
    origin: origenes,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    exposedHeaders: ['Location'],
  });

  const config = new DocumentBuilder()
    .setTitle('Plataforma Educativa')
    .setDescription('Servicio de carga academica: alumnos, maestros y control escolar')
    .setVersion('2.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  const documento = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documento);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
