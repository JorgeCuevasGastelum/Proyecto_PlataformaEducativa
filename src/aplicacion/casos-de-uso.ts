import { Inject, Injectable } from '@nestjs/common';
import { BaseDeDatos } from '../infra/base-de-datos.js';
import { RepositorioPrisma } from '../infra/repositorio-prisma.js';
import { HashConScrypt } from '../infra/hash-scrypt.js';
import { ServicioAlumno } from '../dominio/servicio-alumno.js';
import { ServicioMaestro } from '../dominio/servicio-maestro.js';
import { ServicioAdministracion } from '../dominio/servicio-administracion.js';
import { ServicioAutenticacion } from '../dominio/servicio-autenticacion.js';

function servicios(repo: RepositorioPrisma) {
  const hash = new HashConScrypt();
  return {
    repo,
    alumnos: new ServicioAlumno(repo),
    maestros: new ServicioMaestro(repo),
    administracion: new ServicioAdministracion(repo, hash),
    autenticacion: new ServicioAutenticacion(repo, hash),
  };
}
export type Servicios = ReturnType<typeof servicios>;

@Injectable()
export class CasosDeUso {
  constructor(@Inject(BaseDeDatos) private readonly db: BaseDeDatos) {}
  ejecutar<T>(escritura: boolean, accion: (s: Servicios) => Promise<T>): Promise<T> {
    // Único punto que selecciona la implementación del repositorio para la API.
    if (escritura) return this.db.escritura(tx => accion(servicios(new RepositorioPrisma(tx))));
    return accion(servicios(new RepositorioPrisma(this.db)));
  }
}
