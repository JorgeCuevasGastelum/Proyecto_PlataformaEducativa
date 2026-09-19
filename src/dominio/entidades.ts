import { RangoHorarioInvalidoError } from './errores.js';

export type EstadoInscripcion = 'activa' | 'baja';

export interface Alumno {
  id: number;
  matricula: string;
  nombre: string;
  correoInstitucional: string;
}

export interface Maestro {
  id: number;
  numeroEmpleado: string;
  nombre: string;
  correoInstitucional: string;
}

export interface Administrador {
  id: number;
  nombre: string;
  correoInstitucional: string;
}

export interface BloqueHorario {
  diaSemana: string;
  minutoInicio: number;
  minutoFin: number;
}

export function crearBloqueHorario(diaSemana: string, horaInicio: string, horaFin: string): BloqueHorario {
  const minutoInicio = aMinutos(horaInicio);
  const minutoFin = aMinutos(horaFin);
  if (minutoFin <= minutoInicio) {
    throw new RangoHorarioInvalidoError(horaInicio, horaFin);
  }
  return { diaSemana, minutoInicio, minutoFin };
}

function aMinutos(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

export interface Materia {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string;
  creditos: number;
  cupoMaximo: number;
  maestroId: number;
  horario: BloqueHorario[];
}

export interface PeriodoEscolar {
  id: number;
  clave: string;
  fechaAperturaCarga: Date;
  fechaCierreCarga: Date;
  creditosMaximos: number;
  habilitado: boolean;
}

export interface Inscripcion {
  id: number;
  alumnoId: number;
  materiaId: number;
  periodoId: number;
  fechaRegistro: Date;
  estadoActual: EstadoInscripcion;
}

export interface Aviso {
  id: number;
  titulo: string;
  contenido: string;
  periodoId: number;
  fechaPublicacion: Date;
}



export interface RenglonDeHorario {
  diaSemana: string;
  minutoInicio: number;
  minutoFin: number;
  materiaNombre: string;
  maestroNombre: string;
}

export interface Historial {
  periodoClave: string;
  materias: Materia[];
}
