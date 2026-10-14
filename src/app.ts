import 'reflect-metadata';
import { Module, Controller, Get, Inject, ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { SwaggerModule, DocumentBuilder, ApiTags, ApiOperation } from '@nestjs/swagger';
import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';
import { leerConfiguracion } from './config/configuracion.js';
import { BaseDeDatos } from './infra/base-de-datos.js';
import { CasosDeUso } from './aplicacion/casos-de-uso.js';
import { AccesoGuard, Publico } from './seguridad/acceso.js';
import { ErroresFilter, RespuestaInterceptor, respuestaError } from './http/respuestas.js';
import { ApiRespuestas } from './modelos/salidas.js';
import { AuthController } from './controladores/auth.controller.js';
import { AlumnosController } from './controladores/alumnos.controller.js';
import { MaestrosController } from './controladores/maestros.controller.js';
import { CatalogoController } from './controladores/catalogo.controller.js';
import { OperacionesController } from './controladores/operaciones.controller.js';

@ApiTags('Estado') @Controller('salud')
class SaludController {
  constructor(@Inject(CasosDeUso) private readonly casos: CasosDeUso) {}
  @Publico() @Get() @ApiRespuestas() @ApiOperation({ summary: 'Verificar servicio y conexión a MySQL' })
  salud() { return this.casos.ejecutar(false, async s => { await s.repo.buscarPeriodoConCargaAbierta(); return { servicio: 'disponible', baseDeDatos: 'disponible' }; }); }
}

@Module({
  imports: [JwtModule.registerAsync({ useFactory: () => {
    const c = leerConfiguracion();
    return { secret: c.secret, signOptions: { algorithm: 'HS256', expiresIn: c.ttl, issuer: 'plataforma-educativa', audience: 'plataforma-clientes' } };
  } })],
  controllers: [SaludController, AuthController, AlumnosController, MaestrosController, CatalogoController, OperacionesController],
  providers: [BaseDeDatos, CasosDeUso, { provide: APP_GUARD, useClass: AccesoGuard }],
})
export class AppModule {}

export async function crearAplicacion(silenciosa = false) {
  const c = leerConfiguracion();
  const app = await NestFactory.create(AppModule, { logger: silenciosa ? false : ['log', 'warn', 'error'], abortOnError: false });
  app.setGlobalPrefix('api');
  const logger = new Logger('HTTP');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const inicio = performance.now();
    res.on('finish', () => {
      if (!silenciosa) logger.log(req.method + ' ' + req.path + ' ' + res.statusCode + ' ' + (performance.now() - inicio).toFixed(1) + 'ms');
    });
    next();
  });
  app.use(helmet());
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && !c.origins.includes(origin)) {
      res.status(403).json(respuestaError('ORIGEN_NO_PERMITIDO', 'El origen de la aplicación no está permitido.'));
      return;
    }
    next();
  });
  app.enableCors({ origin: c.origins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true, transformOptions: { enableImplicitConversion: false } }));
  app.useGlobalFilters(new ErroresFilter());
  app.useGlobalInterceptors(new RespuestaInterceptor());
  const document = SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle('Plataforma Educativa — Avance 2')
    .setDescription('API de carga académica. Registro de cuentas a cargo del administrador. Los errores de negocio se distinguen de los errores de petición.')
    .setVersion('2.0.0').addBearerAuth().build());
  SwaggerModule.setup('docs', app, document, { swaggerOptions: { persistAuthorization: false } });
  app.enableShutdownHooks();
  await app.init();
  return app;
}
