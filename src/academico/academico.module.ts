import { Global, Module } from '@nestjs/common';
import type { GeneradorDeHash } from '../dominio/generador-de-hash';
import type { RepositorioAcademico } from '../dominio/repositorio-academico';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioAlumno } from '../dominio/servicio-alumno';
import { ServicioAutenticacion } from '../dominio/servicio-autenticacion';
import { ServicioCatalogo } from '../dominio/servicio-catalogo';
import { ServicioMaestro } from '../dominio/servicio-maestro';
import { HashConScrypt } from '../infra/hash-scrypt';
import { RepositorioPrisma } from '../infra/repositorio-prisma';
import { GENERADOR_HASH, REPOSITORIO_ACADEMICO } from './academico.tokens';

@Global()
@Module({
  providers: [
    {
      provide: REPOSITORIO_ACADEMICO,
      useClass: RepositorioPrisma,
    },
    { provide: GENERADOR_HASH, useClass: HashConScrypt },
    {
      provide: ServicioAutenticacion,
      useFactory: (repo: RepositorioAcademico, hash: GeneradorDeHash) => new ServicioAutenticacion(repo, hash),
      inject: [REPOSITORIO_ACADEMICO, GENERADOR_HASH],
    },
    {
      provide: ServicioAdministracion,
      useFactory: (repo: RepositorioAcademico, hash: GeneradorDeHash) => new ServicioAdministracion(repo, hash),
      inject: [REPOSITORIO_ACADEMICO, GENERADOR_HASH],
    },
    {
      provide: ServicioAlumno,
      useFactory: (repo: RepositorioAcademico) => new ServicioAlumno(repo),
      inject: [REPOSITORIO_ACADEMICO],
    },
    {
      provide: ServicioMaestro,
      useFactory: (repo: RepositorioAcademico) => new ServicioMaestro(repo),
      inject: [REPOSITORIO_ACADEMICO],
    },
    {
      provide: ServicioCatalogo,
      useFactory: (repo: RepositorioAcademico) => new ServicioCatalogo(repo),
      inject: [REPOSITORIO_ACADEMICO],
    },
  ],
  exports: [ServicioAutenticacion, ServicioAdministracion, ServicioAlumno, ServicioMaestro, ServicioCatalogo],
})
export class AcademicoModule {}
