// Los tipos se declaran una sola vez en el servicio (src/dominio/entidades.ts)
// y aquí solo se importan, igual que en el portal.
import type {
  Alumno,
  AlumnoEnLista,
  Aviso as AvisoDelServicio,
  BloqueHorario,
  Carrera,
  ConceptoDePago,
  DiaSemana,
  EstadoDePago,
  GrupoDeCatalogo,
  Maestro,
  Materia,
  Pago as PagoDelServicio,
  PeriodoEscolar as PeriodoDelServicio,
  PlanDeEstudios,
} from '../../../../src/dominio/entidades';

export type {
  Alumno,
  AlumnoEnLista,
  BloqueHorario,
  Carrera,
  ConceptoDePago,
  DiaSemana,
  EstadoDePago,
  GrupoDeCatalogo,
  Maestro,
  Materia,
  PlanDeEstudios,
};

// Por JSON las fechas llegan como texto.
export type PeriodoEscolar = Omit<PeriodoDelServicio, 'fechaAperturaCarga' | 'fechaCierreCarga'> & {
  fechaAperturaCarga: string;
  fechaCierreCarga: string;
};

export type Pago = Omit<PagoDelServicio, 'fechaLimite' | 'fechaPago'> & {
  fechaLimite: string;
  fechaPago: string | null;
};

export type Aviso = Omit<AvisoDelServicio, 'fechaPublicacion'> & {
  fechaPublicacion: string;
};

// Todo lo que responde el servicio viene dentro de { data, meta }.
export interface Sobre<T> {
  data: T;
  meta?: unknown;
}
