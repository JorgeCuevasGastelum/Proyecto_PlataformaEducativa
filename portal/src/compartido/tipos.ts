// Los tipos de lo que viaja por la red se declaran una sola vez, en el servicio
// (src/dominio/entidades.ts), y aquí solo se importan. Son "import type": no meten
// código del servicio en el portal, solo los usa TypeScript para revisar.
import type {
  AlumnoEnLista,
  Aviso as AvisoDelServicio,
  BloqueHorario,
  CapturaDeCalificacion,
  ConceptoDePago,
  CredencialDeAcceso,
  DiaSemana,
  EstadoDePago,
  GrupoDeCatalogo,
  GrupoDelMaestro,
  Historial,
  Inscripcion as InscripcionDelServicio,
  Materia,
  MateriaCursada,
  MateriaInscrita,
  Pago as PagoDelServicio,
  PeriodoEscolar as PeriodoDelServicio,
  PlanDeEstudios,
  RenglonDeHorario,
  Rol,
  Sesion as SesionDelServicio,
} from '../../../src/dominio/entidades';

// Estos llegan igual que como los declara el servicio.
export type {
  AlumnoEnLista,
  BloqueHorario,
  CapturaDeCalificacion,
  ConceptoDePago,
  DiaSemana,
  EstadoDePago,
  GrupoDeCatalogo,
  GrupoDelMaestro,
  Historial,
  Materia,
  MateriaCursada,
  MateriaInscrita,
  PlanDeEstudios,
  RenglonDeHorario,
  Rol,
  SesionDelServicio,
};
export type RespuestaDeLogin = CredencialDeAcceso;

// En el servicio las fechas son Date, pero por JSON llegan como texto.
// Por eso en estos cuatro se cambian las fechas a string.
export type PeriodoEscolar = Omit<PeriodoDelServicio, 'fechaAperturaCarga' | 'fechaCierreCarga'> & {
  fechaAperturaCarga: string;
  fechaCierreCarga: string;
};

export type Inscripcion = Omit<InscripcionDelServicio, 'fechaRegistro'> & {
  fechaRegistro: string;
};

export type Pago = Omit<PagoDelServicio, 'fechaLimite' | 'fechaPago'> & {
  fechaLimite: string;
  fechaPago: string | null;
};

export type Aviso = Omit<AvisoDelServicio, 'fechaPublicacion'> & {
  fechaPublicacion: string;
};

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
