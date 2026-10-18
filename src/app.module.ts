import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AcademicoModule } from './academico/academico.module';
import { AlumnosModule } from './alumnos/alumnos.module';
import { AuthModule } from './auth/auth.module';
import { AvisosModule } from './avisos/avisos.module';
import { RegistroMiddleware } from './comun/middleware/registro.middleware';
import { GruposModule } from './grupos/grupos.module';
import { InscripcionesModule } from './inscripciones/inscripciones.module';
import { MaestrosModule } from './maestros/maestros.module';
import { MateriasModule } from './materias/materias.module';
import { PagosModule } from './pagos/pagos.module';
import { PeriodosModule } from './periodos/periodos.module';
import { PlanesModule } from './planes/planes.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AcademicoModule,
    AuthModule,
    AlumnosModule,
    MaestrosModule,
    MateriasModule,
    PlanesModule,
    PeriodosModule,
    GruposModule,
    InscripcionesModule,
    PagosModule,
    AvisosModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RegistroMiddleware).forRoutes('*');
  }
}
