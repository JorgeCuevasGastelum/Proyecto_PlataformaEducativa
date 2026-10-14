import { RangoHorarioInvalidoError } from './errores.js';

export type Rol = 'alumno' | 'maestro' | 'administrador';

export type EstadoInscripcion = 'activa' | 'baja';

export type ConceptoDePago = 'inscripcion' | 'colegiatura';

export type EstadoDePago = 'pendiente' | 'pagado';

export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';

// El orden de este arreglo es el que se usa para ordenar el horario semanal.
export const DIAS_DE_LA_SEMANA: readonly DiaSemana[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export const CALIFICACION_MINIMA = 0;
export const CALIFICACION_MAXIMA = 100;
export const CALIFICACION_APROBATORIA = 70;
export const LONGITUD_MINIMA_CONTRASENA = 8;

// --- Acceso ---

// La cuenta con la que se inicia sesion. personaId apunta al Alumno, Maestro o Administrador segun el rol.
export interface Usuario {
  id: number;
  correoInstitucional: string;
  contrasenaHash: string;
  rol: Rol;
  personaId: number;
}

// Lo que obtiene quien inicia sesion; los servicios la reciben para saber quien hace la operacion.
export interface Sesion {
  usuarioId: number;
  rol: Rol;
  personaId: number;
}

// --- Personas ---

export interface Alumno {
  id: number;
  matricula: string;
  nombre: string;
  planDeEstudiosId: number;
}

export interface Maestro {
  id: number;
  numeroEmpleado: string;
  nombre: string;
}

export interface Administrador {
  id: number;
  nombre: string;
}

// --- Catalogo academico ---

export interface Carrera {
  id: number;
  clave: string;
  nombre: string;
}

// Una materia puede aparecer en varios planes (por ejemplo, Ingles I es comun a todas las carreras).
export interface PlanDeEstudios {
  id: number;
  clave: string;
  carreraId: number;
  materiaIds: number[];
}

// La materia es solo el catalogo: no tiene maestro, cupo ni horario. Eso pertenece al Grupo de cada periodo.
export interface Materia {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string;
  creditos: number;
  prerrequisitoIds: number[];
}

export interface BloqueHorario {
  diaSemana: DiaSemana;
  minutoInicio: number;
  minutoFin: number;
}

// RN-09
export function crearBloqueHorario(diaSemana: DiaSemana, horaInicio: string, horaFin: string): BloqueHorario {
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

// El grupo que se abre de una materia en un periodo concreto.
export interface Grupo {
  id: number;
  materiaId: number;
  periodoId: number;
  clave: string;
  maestroId: number;
  cupoMaximo: number;
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

// --- Operacion ---

// La inscripcion es al grupo. La calificacion la captura el maestro; mientras sea null la materia esta en curso.
export interface Inscripcion {
  id: number;
  alumnoId: number;
  grupoId: number;
  fechaRegistro: Date;
  estadoActual: EstadoInscripcion;
  calificacion: number | null;
}

export interface Pago {
  id: number;
  alumnoId: number;
  periodoId: number;
  concepto: ConceptoDePago;
  monto: number;
  fechaLimite: Date;
  estado: EstadoDePago;
  fechaPago: Date | null;
}

export interface Aviso {
  id: number;
  titulo: string;
  contenido: string;
  periodoId: number;
  fechaPublicacion: Date;
}

// --- Vistas que regresan los servicios ---

export interface MateriaInscrita {
  inscripcionId: number;
  materiaClave: string;
  materiaNombre: string;
  grupoClave: string;
  creditos: number;
}

export interface RenglonDeHorario {
  diaSemana: DiaSemana;
  minutoInicio: number;
  minutoFin: number;
  materiaNombre: string;
  grupoClave: string;
  maestroNombre: string;
}

export interface MateriaCursada {
  materiaClave: string;
  materiaNombre: string;
  creditos: number;
  grupoClave: string;
  calificacion: number | null;
  // null mientras el maestro no capture la calificacion.
  aprobada: boolean | null;
}

export interface Historial {
  periodoClave: string;
  materias: MateriaCursada[];
}

export interface GrupoDelMaestro {
  grupoId: number;
  grupoClave: string;
  materiaNombre: string;
  periodoClave: string;
  inscritos: number;
}

export interface AlumnoEnLista {
  inscripcionId: number;
  matricula: string;
  nombre: string;
  calificacion: number | null;
}

export interface CapturaDeCalificacion {
  inscripcionId: number;
  calificacion: number;
}
