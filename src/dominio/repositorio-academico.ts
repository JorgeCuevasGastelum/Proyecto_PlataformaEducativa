import type {
  Administrador,
  Alumno,
  Aviso,
  Carrera,
  Grupo,
  Inscripcion,
  Maestro,
  Materia,
  Pago,
  PeriodoEscolar,
  PlanDeEstudios,
  Usuario,
} from './entidades.js';

export type NuevoUsuario = Omit<Usuario, 'id'>;
export type NuevoAlumno = Omit<Alumno, 'id'>;
export type NuevoMaestro = Omit<Maestro, 'id'>;
export type NuevaMateria = Omit<Materia, 'id'>;
export type NuevoGrupo = Omit<Grupo, 'id'>;
export type NuevaInscripcion = Omit<Inscripcion, 'id'>;
export type NuevoPago = Omit<Pago, 'id'>;
export type NuevoAviso = Omit<Aviso, 'id'>;
export type NuevoPeriodo = Omit<PeriodoEscolar, 'id'>;

export interface RepositorioAcademico {
  // Acceso
  buscarUsuarioPorCorreo(correo: string): Promise<Usuario | null>;

  crearUsuario(datos: NuevoUsuario): Promise<Usuario>;

  // Personas
  buscarAlumnoPorId(id: number): Promise<Alumno | null>;

  buscarAlumnoPorMatricula(matricula: string): Promise<Alumno | null>;

  buscarMaestroPorId(id: number): Promise<Maestro | null>;

  buscarMaestroPorNumeroEmpleado(numeroEmpleado: string): Promise<Maestro | null>;

  buscarAdministradorPorId(id: number): Promise<Administrador | null>;

  crearAlumno(datos: NuevoAlumno): Promise<Alumno>;

  crearMaestro(datos: NuevoMaestro): Promise<Maestro>;

  listarAlumnos(): Promise<Alumno[]>;

  listarMaestros(): Promise<Maestro[]>;

  // Catalogo
  listarCarreras(): Promise<Carrera[]>;

  buscarCarreraPorId(id: number): Promise<Carrera | null>;

  listarPlanesDeEstudio(): Promise<PlanDeEstudios[]>;

  buscarPlanDeEstudiosPorId(id: number): Promise<PlanDeEstudios | null>;

  actualizarPlanDeEstudios(plan: PlanDeEstudios): Promise<void>;

  listarMaterias(): Promise<Materia[]>;

  buscarMateriaPorId(id: number): Promise<Materia | null>;

  buscarMateriaPorClave(clave: string): Promise<Materia | null>;

  crearMateria(datos: NuevaMateria): Promise<Materia>;

  buscarGrupoPorId(id: number): Promise<Grupo | null>;

  listarGruposDeMateriaEnPeriodo(materiaId: number, periodoId: number): Promise<Grupo[]>;

  listarGruposDeMaestro(maestroId: number): Promise<Grupo[]>;

  listarGruposDePeriodo(periodoId: number): Promise<Grupo[]>;

  crearGrupo(datos: NuevoGrupo): Promise<Grupo>;

  // Periodos
  listarPeriodos(): Promise<PeriodoEscolar[]>;

  buscarPeriodoPorId(id: number): Promise<PeriodoEscolar | null>;

  buscarPeriodoPorClave(clave: string): Promise<PeriodoEscolar | null>;

  crearPeriodo(datos: NuevoPeriodo): Promise<PeriodoEscolar>;

  buscarPeriodoConCargaAbierta(): Promise<PeriodoEscolar | null>;

  actualizarPeriodo(periodo: PeriodoEscolar): Promise<void>;

  // Inscripciones
  buscarInscripcionPorId(id: number): Promise<Inscripcion | null>;

  contarInscripcionesActivasDeGrupo(grupoId: number): Promise<number>;

  listarInscripcionesDeAlumno(alumnoId: number): Promise<Inscripcion[]>;

  listarInscripcionesDeGrupo(grupoId: number): Promise<Inscripcion[]>;

  crearInscripcion(datos: NuevaInscripcion): Promise<Inscripcion>;

  actualizarInscripcion(inscripcion: Inscripcion): Promise<void>;

  // Pagos
  buscarPagoPorId(id: number): Promise<Pago | null>;

  listarPagosDeAlumno(alumnoId: number): Promise<Pago[]>;

  crearPago(datos: NuevoPago): Promise<Pago>;

  actualizarPago(pago: Pago): Promise<void>;

  // Avisos
  listarAvisosDePeriodo(periodoId: number): Promise<Aviso[]>;

  crearAviso(datos: NuevoAviso): Promise<Aviso>;
}
