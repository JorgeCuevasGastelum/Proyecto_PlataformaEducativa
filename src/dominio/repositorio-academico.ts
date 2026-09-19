import type { Administrador, Alumno, Aviso, Inscripcion, Maestro, Materia, PeriodoEscolar } from './entidades.js';

export type NuevoAlumno = Omit<Alumno, 'id'>;
export type NuevoMaestro = Omit<Maestro, 'id'>;
export type NuevaMateria = Omit<Materia, 'id'>;
export type NuevaInscripcion = Omit<Inscripcion, 'id'>;
export type NuevoAviso = Omit<Aviso, 'id'>;

export interface RepositorioAcademico {
  buscarAlumnoPorId(id: number): Promise<Alumno | null>;

  buscarAlumnoPorMatricula(matricula: string): Promise<Alumno | null>;

  buscarMaestroPorId(id: number): Promise<Maestro | null>;

  buscarMaestroPorNumeroEmpleado(numeroEmpleado: string): Promise<Maestro | null>;

  buscarAdministradorPorId(id: number): Promise<Administrador | null>;

  buscarMateriaPorId(id: number): Promise<Materia | null>;

  buscarPeriodoPorId(id: number): Promise<PeriodoEscolar | null>;

  buscarPeriodoConCargaAbierta(): Promise<PeriodoEscolar | null>;

  contarInscripcionesActivasDeMateria(materiaId: number, periodoId: number): Promise<number>;

  listarInscripcionesDeAlumnoEnPeriodo(alumnoId: number, periodoId: number): Promise<Inscripcion[]>;

  listarInscripcionesDeAlumno(alumnoId: number): Promise<Inscripcion[]>;

  listarAvisosDePeriodo(periodoId: number): Promise<Aviso[]>;

  crearAlumno(datos: NuevoAlumno): Promise<Alumno>;

  crearMaestro(datos: NuevoMaestro): Promise<Maestro>;

  crearMateria(datos: NuevaMateria): Promise<Materia>;

  crearInscripcion(datos: NuevaInscripcion): Promise<Inscripcion>;

  crearAviso(datos: NuevoAviso): Promise<Aviso>;

  actualizarInscripcion(inscripcion: Inscripcion): Promise<void>;
  
  actualizarPeriodo(periodo: PeriodoEscolar): Promise<void>;
}
