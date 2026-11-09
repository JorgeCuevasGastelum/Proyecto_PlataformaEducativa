// Los tipos de lo que viaja por la red se declaran una sola vez, en el servicio
// (src/dominio/entidades.ts), y aquí solo se importan. Son importaciones de tipo:
// no meten código del servicio en el portal, solo lo usa TypeScript para revisar.
import type * as Servicio from '@servicio/dominio/entidades';

// Por JSON las fechas (Date) llegan como texto ISO; el resto llega igual.
export type EnJson<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? EnJson<U>[]
    : T extends object
      ? { [K in keyof T]: EnJson<T[K]> }
      : T;

export type Rol = Servicio.Rol;
export type DiaSemana = Servicio.DiaSemana;
export type ConceptoDePago = Servicio.ConceptoDePago;
export type EstadoDePago = Servicio.EstadoDePago;

export type RespuestaDeLogin = EnJson<Servicio.CredencialDeAcceso>;
export type SesionDelServicio = EnJson<Servicio.Sesion>;
export type BloqueHorario = EnJson<Servicio.BloqueHorario>;
export type PeriodoEscolar = EnJson<Servicio.PeriodoEscolar>;
export type Materia = EnJson<Servicio.Materia>;
export type PlanDeEstudios = EnJson<Servicio.PlanDeEstudios>;
export type GrupoDeCatalogo = EnJson<Servicio.GrupoDeCatalogo>;
export type Inscripcion = EnJson<Servicio.Inscripcion>;
export type MateriaInscrita = EnJson<Servicio.MateriaInscrita>;
export type RenglonDeHorario = EnJson<Servicio.RenglonDeHorario>;
export type MateriaCursada = EnJson<Servicio.MateriaCursada>;
export type Historial = EnJson<Servicio.Historial>;
export type Pago = EnJson<Servicio.Pago>;
export type Aviso = EnJson<Servicio.Aviso>;
export type GrupoDelMaestro = EnJson<Servicio.GrupoDelMaestro>;
export type AlumnoEnLista = EnJson<Servicio.AlumnoEnLista>;
export type CapturaDeCalificacion = EnJson<Servicio.CapturaDeCalificacion>;

// Estos dos no viajan por la red: son lo que el portal guarda de la sesión en el navegador.
export interface Usuario {
  correo: string;
  rol: Rol;
  personaId: number;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}
