import { Alumno, Aviso, BloqueHorario, Historial, Inscripcion, Maestro, Materia, PeriodoEscolar, RenglonDeHorario, } from './entidades.js';
import type { RepositorioAcademico } from './repositorio-academico.js';
import {
  AlumnoInvalidoError,
  AlumnoNoEncontradoError,
  CupoAgotadoError,
  EmpalmeDeHorarioError,
  LimiteDeCreditosExcedidoError,
  MaestroInvalidoError,
  MaestroNoEncontradoError,
  MateriaInvalidaError,
  MateriaYaInscritaError,
  MatriculaDuplicadaError,
  NumeroEmpleadoDuplicadoError,
  OperacionNoAutorizadaError,
  PeriodoDeCargaCerradoError,
  PeriodoNoEncontradoError,
  YaExistePeriodoAbiertoError,
} from './errores.js';

interface DatosNuevaMateria {
  clave: string;
  nombre: string;
  descripcion: string;
  creditos: number;
  cupoMaximo: number;
  maestroId: number;
  horario: BloqueHorario[];
}

function bloquesSeEmpalman(a: BloqueHorario, b: BloqueHorario): boolean {
  if (a.diaSemana !== b.diaSemana) return false;
  return a.minutoInicio < b.minutoFin && b.minutoInicio < a.minutoFin;
}

function materiasSeEmpalman(a: Materia, b: Materia): boolean {
  return a.horario.some((bloque) => b.horario.some((otroBloque) => bloquesSeEmpalman(bloque, otroBloque)));
}

export class ServicioAcademico {
  constructor(private readonly repo: RepositorioAcademico) {}

  async realizarCargaAcademica(alumnoId: number, materiaId: number): Promise<Inscripcion> {
    const alumno = await this.repo.buscarAlumnoPorId(alumnoId);
    if (!alumno) throw new AlumnoNoEncontradoError(String(alumnoId));

    const materia = await this.repo.buscarMateriaPorId(materiaId);
    if (!materia) throw new MateriaInvalidaError(`no existe la materia ${materiaId}`);

    const periodo = await this.repo.buscarPeriodoConCargaAbierta();
    const ahora = new Date();
    if (!periodo || !periodo.habilitado || ahora < periodo.fechaAperturaCarga || ahora > periodo.fechaCierreCarga) {
      throw new PeriodoDeCargaCerradoError();
    }

    const inscripcionesDelAlumno = await this.repo.listarInscripcionesDeAlumnoEnPeriodo(alumnoId, periodo.id);
    const activas = inscripcionesDelAlumno.filter((i) => i.estadoActual === 'activa');

    if (activas.some((i) => i.materiaId === materiaId)) {
      throw new MateriaYaInscritaError(String(materiaId));
    }

    const inscritosEnMateria = await this.repo.contarInscripcionesActivasDeMateria(materiaId, periodo.id);
    if (inscritosEnMateria >= materia.cupoMaximo) {
      throw new CupoAgotadoError(String(materiaId));
    }

    let creditosAcumulados = materia.creditos;
    for (const inscripcionActiva of activas) {
      const materiaInscrita = await this.repo.buscarMateriaPorId(inscripcionActiva.materiaId);
      if (!materiaInscrita) continue;

      if (materiasSeEmpalman(materia, materiaInscrita)) {
        throw new EmpalmeDeHorarioError(String(materiaId), String(materiaInscrita.id));
      }
      creditosAcumulados += materiaInscrita.creditos;
    }

    if (creditosAcumulados > periodo.creditosMaximos) {
      throw new LimiteDeCreditosExcedidoError(periodo.creditosMaximos);
    }

    return this.repo.crearInscripcion({
      alumnoId,
      materiaId,
      periodoId: periodo.id,
      fechaRegistro: new Date(),
      estadoActual: 'activa',
    });
  }

  async cancelarInscripcion(alumnoId: number, inscripcionId: number): Promise<Inscripcion> {
    const inscripciones = await this.repo.listarInscripcionesDeAlumno(alumnoId);
    const inscripcion = inscripciones.find((i) => i.id === inscripcionId);
    if (!inscripcion) throw new AlumnoNoEncontradoError(String(alumnoId));

    inscripcion.estadoActual = 'baja';
    await this.repo.actualizarInscripcion(inscripcion);
    return inscripcion;
  }

  async consultarMateriasInscritas(alumnoId: number): Promise<Materia[]> {
    const alumno = await this.repo.buscarAlumnoPorId(alumnoId);
    if (!alumno) throw new AlumnoNoEncontradoError(String(alumnoId));

    const periodo = await this.repo.buscarPeriodoConCargaAbierta();
    if (!periodo) return [];

    const inscripciones = await this.repo.listarInscripcionesDeAlumnoEnPeriodo(alumnoId, periodo.id);
    const materias: Materia[] = [];
    for (const inscripcion of inscripciones.filter((i) => i.estadoActual === 'activa')) {
      const materia = await this.repo.buscarMateriaPorId(inscripcion.materiaId);
      if (materia) materias.push(materia);
    }
    return materias;
  }

  async consultarHorarioSemanal(alumnoId: number): Promise<RenglonDeHorario[]> {
    const materias = await this.consultarMateriasInscritas(alumnoId);
    const renglones: RenglonDeHorario[] = [];
    for (const materia of materias) {
      const maestro = await this.repo.buscarMaestroPorId(materia.maestroId);
      for (const bloque of materia.horario) {
        renglones.push({
          diaSemana: bloque.diaSemana,
          minutoInicio: bloque.minutoInicio,
          minutoFin: bloque.minutoFin,
          materiaNombre: materia.nombre,
          maestroNombre: maestro?.nombre ?? 'Sin asignar',
        });
      }
    }
    return renglones.sort((a, b) => a.minutoInicio - b.minutoInicio);
  }

  async consultarHistorial(alumnoId: number): Promise<Historial[]> {
    const alumno = await this.repo.buscarAlumnoPorId(alumnoId);
    if (!alumno) throw new AlumnoNoEncontradoError(String(alumnoId));

    const inscripciones = await this.repo.listarInscripcionesDeAlumno(alumnoId);
    const materiasPorPeriodo = new Map<number, Materia[]>();
    for (const inscripcion of inscripciones) {
      const materia = await this.repo.buscarMateriaPorId(inscripcion.materiaId);
      if (!materia) continue;
      const lista = materiasPorPeriodo.get(inscripcion.periodoId) ?? [];
      lista.push(materia);
      materiasPorPeriodo.set(inscripcion.periodoId, lista);
    }

    const historial: Historial[] = [];
    for (const [periodoId, materias] of materiasPorPeriodo) {
      const periodo = await this.repo.buscarPeriodoPorId(periodoId);
      historial.push({ periodoClave: periodo?.clave ?? String(periodoId), materias });
    }
    return historial;
  }

  async consultarAvisos(periodoId: number): Promise<Aviso[]> {
    return this.repo.listarAvisosDePeriodo(periodoId);
  }

  async registrarMateria(adminId: number, datos: DatosNuevaMateria): Promise<Materia> {
    await this.verificarAdministrador(adminId);

    const maestro = await this.repo.buscarMaestroPorId(datos.maestroId);
    if (!maestro) throw new MaestroNoEncontradoError(String(datos.maestroId));

    if (datos.creditos <= 0 || datos.cupoMaximo <= 0 || datos.horario.length === 0) {
      throw new MateriaInvalidaError('debe tener creditos y cupo mayores a cero, y al menos un bloque de horario');
    }

    return this.repo.crearMateria(datos);
  }

  async abrirCargaAcademica(adminId: number, periodoId: number): Promise<PeriodoEscolar> {
    await this.verificarAdministrador(adminId);

    const periodoAbierto = await this.repo.buscarPeriodoConCargaAbierta();
    if (periodoAbierto && periodoAbierto.id !== periodoId) {
      throw new YaExistePeriodoAbiertoError(String(periodoAbierto.id));
    }

    const periodo = await this.repo.buscarPeriodoPorId(periodoId);
    if (!periodo) throw new PeriodoNoEncontradoError(String(periodoId));

    periodo.habilitado = true;
    await this.repo.actualizarPeriodo(periodo);
    return periodo;
  }

  async cerrarCargaAcademica(adminId: number, periodoId: number): Promise<PeriodoEscolar> {
    await this.verificarAdministrador(adminId);

    const periodo = await this.repo.buscarPeriodoPorId(periodoId);
    if (!periodo) throw new PeriodoNoEncontradoError(String(periodoId));

    periodo.habilitado = false;
    await this.repo.actualizarPeriodo(periodo);
    return periodo;
  }

  async consultarOcupacionDeMateria(adminId: number, materiaId: number): Promise<{ ocupados: number; disponibles: number }> {
    await this.verificarAdministrador(adminId);

    const materia = await this.repo.buscarMateriaPorId(materiaId);
    if (!materia) throw new MateriaInvalidaError(`no existe la materia ${materiaId}`);

    const periodo = await this.repo.buscarPeriodoConCargaAbierta();
    const ocupados = periodo ? await this.repo.contarInscripcionesActivasDeMateria(materiaId, periodo.id) : 0;
    return { ocupados, disponibles: materia.cupoMaximo - ocupados };
  }

  async publicarAviso(adminId: number, periodoId: number, titulo: string, contenido: string): Promise<Aviso> {
    await this.verificarAdministrador(adminId);

    const periodo = await this.repo.buscarPeriodoPorId(periodoId);
    if (!periodo) throw new PeriodoNoEncontradoError(String(periodoId));

    return this.repo.crearAviso({ titulo, contenido, periodoId, fechaPublicacion: new Date() });
  }

  async registrarAlumno(
    adminId: number,
    datos: { matricula: string; nombre: string; correoInstitucional: string },
  ): Promise<Alumno> {
    await this.verificarAdministrador(adminId);

    if (!datos.matricula || !datos.nombre || !datos.correoInstitucional) {
      throw new AlumnoInvalidoError('faltan datos obligatorios');
    }

    const existente = await this.repo.buscarAlumnoPorMatricula(datos.matricula);
    if (existente) throw new MatriculaDuplicadaError(datos.matricula);

    return this.repo.crearAlumno(datos);
  }

  async registrarMaestro(
    adminId: number,
    datos: { numeroEmpleado: string; nombre: string; correoInstitucional: string },
  ): Promise<Maestro> {
    await this.verificarAdministrador(adminId);

    if (!datos.numeroEmpleado || !datos.nombre || !datos.correoInstitucional) {
      throw new MaestroInvalidoError('faltan datos obligatorios');
    }

    const existente = await this.repo.buscarMaestroPorNumeroEmpleado(datos.numeroEmpleado);
    if (existente) throw new NumeroEmpleadoDuplicadoError(datos.numeroEmpleado);

    return this.repo.crearMaestro(datos);
  }

  private async verificarAdministrador(adminId: number): Promise<void> {
    const admin = await this.repo.buscarAdministradorPorId(adminId);
    if (!admin) throw new OperacionNoAutorizadaError();
  }
}
