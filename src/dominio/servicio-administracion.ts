import { LONGITUD_MINIMA_CONTRASENA } from './entidades.js';
import type {
  Alumno,
  AlumnoEnLista,
  Aviso,
  BloqueHorario,
  Carrera,
  ConceptoDePago,
  Grupo,
  GrupoDelMaestro,
  Maestro,
  Materia,
  OcupacionDeGrupo,
  Pago,
  PeriodoEscolar,
  PlanDeEstudios,
  ResumenDelPanel,
  Sesion,
} from './entidades.js';
import {
  AlumnoInvalidoError,
  AlumnoNoEncontradoError,
  AvisoNoEncontradoError,
  CarreraInvalidaError,
  CarreraNoEncontradaError,
  ClaveDeCarreraDuplicadaError,
  ClaveDeMateriaDuplicadaError,
  ClaveDePeriodoDuplicadaError,
  ClaveDePlanDuplicadaError,
  CupoMenorAInscritosError,
  ContrasenaDebilError,
  CorreoDuplicadoError,
  EmpalmeDeMaestroError,
  GrupoDuplicadoError,
  GrupoInvalidoError,
  GrupoNoEncontradoError,
  MaestroInvalidoError,
  MaestroNoEncontradoError,
  MateriaEnUsoError,
  MateriaInvalidaError,
  MateriaNoEncontradaError,
  MatriculaDuplicadaError,
  NumeroEmpleadoDuplicadoError,
  OperacionNoAutorizadaError,
  PagoInvalidoError,
  PagoNoEncontradoError,
  PagoYaRegistradoError,
  PersonaConHistorialError,
  PeriodoInvalidoError,
  PeriodoNoEncontradoError,
  PlanDeEstudiosNoEncontradoError,
  RegistroEnUsoError,
  SeriacionInvalidaError,
  YaExistePeriodoAbiertoError,
} from './errores.js';
import type { GeneradorDeHash } from './generador-de-hash.js';
import type { CambiosDeAlumno, DatosDeCuenta, RepositorioAcademico } from './repositorio-academico.js';
import { alumnosInscritosEnGrupo, gruposAsignadosAMaestro } from './consultas.js';
import { exigirRol, horariosSeEmpalman } from './reglas.js';

interface DatosNuevaMateria {
  clave: string;
  nombre: string;
  descripcion: string;
  creditos: number;
  prerrequisitoIds: number[];
}

interface CambiosDeMateria {
  nombre?: string;
  descripcion?: string;
  creditos?: number;
}

interface DatosNuevaCarrera {
  clave: string;
  nombre: string;
}

interface DatosNuevoPlan {
  clave: string;
  carreraId: number;
}

interface CambiosDeGrupo {
  cupoMaximo?: number;
  maestroId?: number;
}

interface DatosNuevoGrupo {
  materiaId: number;
  periodoId: number;
  clave: string;
  maestroId: number;
  cupoMaximo: number;
  horario: BloqueHorario[];
}

interface DatosNuevoAlumno {
  matricula: string;
  nombre: string;
  correoInstitucional: string;
  contrasena: string;
  planDeEstudiosId: number;
}

interface DatosNuevoMaestro {
  numeroEmpleado: string;
  nombre: string;
  correoInstitucional: string;
  contrasena: string;
}

interface DatosNuevoPeriodo {
  clave: string;
  fechaAperturaCarga: Date;
  fechaCierreCarga: Date;
  creditosMaximos: number;
}

interface DatosNuevoCargo {
  alumnoId: number;
  periodoId: number;
  concepto: ConceptoDePago;
  monto: number;
  fechaLimite: Date;
}

export class ServicioAdministracion {
  constructor(
    private readonly repo: RepositorioAcademico,
    private readonly hash: GeneradorDeHash,
  ) {}

  // PERSONAS Y CUENTAS

  // RN-12
  async registrarAlumno(sesion: Sesion, datos: DatosNuevoAlumno): Promise<Alumno> {
    await this.verificarAdministrador(sesion);

    if (!datos.matricula || !datos.nombre || !datos.correoInstitucional) {
      throw new AlumnoInvalidoError('faltan datos obligatorios');
    }

    const plan = await this.repo.buscarPlanDeEstudiosPorId(datos.planDeEstudiosId);
    if (!plan) throw new PlanDeEstudiosNoEncontradoError(String(datos.planDeEstudiosId));

    const existente = await this.repo.buscarAlumnoPorMatricula(datos.matricula);
    if (existente) throw new MatriculaDuplicadaError(datos.matricula);

    const cuenta = await this.prepararCuenta(datos.correoInstitucional, datos.contrasena);

    return this.repo.crearAlumno({
      matricula: datos.matricula,
      nombre: datos.nombre,
      planDeEstudiosId: plan.id,
    }, cuenta);
  }

  // RN-13
  async registrarMaestro(sesion: Sesion, datos: DatosNuevoMaestro): Promise<Maestro> {
    await this.verificarAdministrador(sesion);

    if (!datos.numeroEmpleado || !datos.nombre || !datos.correoInstitucional) {
      throw new MaestroInvalidoError('faltan datos obligatorios');
    }

    const existente = await this.repo.buscarMaestroPorNumeroEmpleado(datos.numeroEmpleado);
    if (existente) throw new NumeroEmpleadoDuplicadoError(datos.numeroEmpleado);

    const cuenta = await this.prepararCuenta(datos.correoInstitucional, datos.contrasena);

    return this.repo.crearMaestro({ numeroEmpleado: datos.numeroEmpleado, nombre: datos.nombre }, cuenta);
  }

  async listarAlumnos(sesion: Sesion): Promise<Alumno[]> {
    await this.verificarAdministrador(sesion);
    return this.repo.listarAlumnos();
  }

  async listarMaestros(sesion: Sesion): Promise<Maestro[]> {
    await this.verificarAdministrador(sesion);
    return this.repo.listarMaestros();
  }

  async obtenerAlumno(sesion: Sesion, id: number): Promise<Alumno> {
    await this.verificarAdministrador(sesion);
    const alumno = await this.repo.buscarAlumnoPorId(id);
    if (!alumno) throw new AlumnoNoEncontradoError(String(id));
    return alumno;
  }

  async editarAlumno(sesion: Sesion, id: number, cambios: CambiosDeAlumno): Promise<Alumno> {
    const alumno = await this.obtenerAlumno(sesion, id);
    const datos: CambiosDeAlumno = {};
    const nombre = cambios.nombre?.trim();
    if (nombre === '') throw new AlumnoInvalidoError('el nombre no puede quedar vacío');
    if (nombre !== undefined) datos.nombre = nombre;

    const planId = cambios.planDeEstudiosId;
    if (planId != null && planId !== alumno.planDeEstudiosId) {
      const plan = await this.repo.buscarPlanDeEstudiosPorId(planId);
      if (!plan) throw new PlanDeEstudiosNoEncontradoError(String(planId));
      datos.planDeEstudiosId = plan.id;
    }

    if (datos.nombre === undefined && datos.planDeEstudiosId === undefined) return alumno;
    return this.repo.actualizarAlumno(id, datos);
  }

  // RN-33
  async eliminarAlumno(sesion: Sesion, id: number): Promise<Alumno> {
    const alumno = await this.obtenerAlumno(sesion, id);
    const [inscripciones, pagos] = await Promise.all([
      this.repo.listarInscripcionesDeAlumno(id),
      this.repo.listarPagosDeAlumno(id),
    ]);
    if (inscripciones.length || pagos.length) {
      throw new PersonaConHistorialError(
        `No se puede borrar a ${alumno.nombre} porque ya tiene inscripciones o pagos registrados.`,
      );
    }
    await this.repo.eliminarAlumno(id);
    return alumno;
  }

  async obtenerMaestro(sesion: Sesion, id: number): Promise<Maestro> {
    await this.verificarAdministrador(sesion);
    const maestro = await this.repo.buscarMaestroPorId(id);
    if (!maestro) throw new MaestroNoEncontradoError(String(id));
    return maestro;
  }

  async editarMaestro(sesion: Sesion, id: number, cambios: { nombre?: string }): Promise<Maestro> {
    const maestro = await this.obtenerMaestro(sesion, id);
    const nombre = cambios.nombre?.trim();
    if (nombre === '') throw new MaestroInvalidoError('el nombre no puede quedar vacío');
    if (nombre === undefined) return maestro;
    return this.repo.actualizarMaestro(id, nombre);
  }

  async consultarGruposDeMaestro(sesion: Sesion, id: number): Promise<GrupoDelMaestro[]> {
    const maestro = await this.obtenerMaestro(sesion, id);
    return gruposAsignadosAMaestro(this.repo, maestro.id);
  }

  // RN-33
  async eliminarMaestro(sesion: Sesion, id: number): Promise<Maestro> {
    const maestro = await this.obtenerMaestro(sesion, id);
    if ((await this.repo.listarGruposDeMaestro(id)).length) {
      throw new PersonaConHistorialError(`No se puede borrar a ${maestro.nombre} porque tiene grupos asignados.`);
    }
    await this.repo.eliminarMaestro(id);
    return maestro;
  }

  // CATÁLOGO

  // RN-06
  async registrarMateria(sesion: Sesion, datos: DatosNuevaMateria): Promise<Materia> {
    await this.verificarAdministrador(sesion);

    if (!datos.clave || !datos.nombre || datos.creditos <= 0) {
      throw new MateriaInvalidaError('debe tener clave, nombre y creditos mayores a cero');
    }

    const existente = await this.repo.buscarMateriaPorClave(datos.clave);
    if (existente) throw new ClaveDeMateriaDuplicadaError(datos.clave);

    for (const prerrequisitoId of datos.prerrequisitoIds) {
      const prerrequisito = await this.repo.buscarMateriaPorId(prerrequisitoId);
      if (!prerrequisito) throw new MateriaNoEncontradaError(String(prerrequisitoId));
    }

    return this.repo.crearMateria(datos);
  }

  async agregarMateriaAPlan(sesion: Sesion, planId: number, materiaId: number): Promise<PlanDeEstudios> {
    await this.verificarAdministrador(sesion);

    const plan = await this.repo.buscarPlanDeEstudiosPorId(planId);
    if (!plan) throw new PlanDeEstudiosNoEncontradoError(String(planId));

    const materia = await this.repo.buscarMateriaPorId(materiaId);
    if (!materia) throw new MateriaNoEncontradaError(String(materiaId));

    if (plan.materiaIds.includes(materiaId)) return plan;

    const actualizado: PlanDeEstudios = { ...plan, materiaIds: [...plan.materiaIds, materiaId] };
    await this.repo.actualizarPlanDeEstudios(actualizado);
    return actualizado;
  }

  async quitarMateriaDePlan(sesion: Sesion, planId: number, materiaId: number): Promise<PlanDeEstudios> {
    await this.verificarAdministrador(sesion);

    const plan = await this.repo.buscarPlanDeEstudiosPorId(planId);
    if (!plan) throw new PlanDeEstudiosNoEncontradoError(String(planId));

    const materia = await this.repo.buscarMateriaPorId(materiaId);
    if (!materia) throw new MateriaNoEncontradaError(String(materiaId));

    // Si no estaba en el plan, no hay nada que quitar.
    if (!plan.materiaIds.includes(materiaId)) return plan;

    const actualizado: PlanDeEstudios = { ...plan, materiaIds: plan.materiaIds.filter((id) => id !== materiaId) };
    await this.repo.actualizarPlanDeEstudios(actualizado);
    return actualizado;
  }

  async obtenerMateria(sesion: Sesion, materiaId: number): Promise<Materia> {
    await this.verificarAdministrador(sesion);

    const materia = await this.repo.buscarMateriaPorId(materiaId);
    if (!materia) throw new MateriaNoEncontradaError(String(materiaId));
    return materia;
  }

  // La clave no se cambia: es como la identifican los planes y el portal.
  async editarMateria(sesion: Sesion, materiaId: number, cambios: CambiosDeMateria): Promise<Materia> {
    const materia = await this.obtenerMateria(sesion, materiaId);

    const nombre = cambios.nombre?.trim() ?? materia.nombre;
    const descripcion = cambios.descripcion?.trim() ?? materia.descripcion;
    const creditos = cambios.creditos ?? materia.creditos;

    if (!nombre) throw new MateriaInvalidaError('el nombre no puede quedar vacío');
    if (creditos <= 0) throw new MateriaInvalidaError('los créditos deben ser mayores a cero');

    const actualizada: Materia = { ...materia, nombre, descripcion, creditos };
    await this.repo.actualizarMateria(actualizada);
    return actualizada;
  }

  // RN-32
  async eliminarMateria(sesion: Sesion, materiaId: number): Promise<Materia> {
    const materia = await this.obtenerMateria(sesion, materiaId);

    const grupos = await this.repo.contarGruposDeMateria(materia.id);
    if (grupos > 0) {
      throw new MateriaEnUsoError(
        `No se puede eliminar ${materia.nombre}: tiene ${grupos} grupo(s) registrados. Las materias con historial no se borran.`,
      );
    }

    const seriadas = (await this.repo.listarMaterias()).filter((m) => m.prerrequisitoIds.includes(materia.id));
    if (seriadas.length > 0) {
      throw new MateriaEnUsoError(
        `No se puede eliminar ${materia.nombre}: es prerrequisito de ${seriadas.map((m) => m.nombre).join(', ')}. Quita primero esa seriación.`,
      );
    }

    const planes = (await this.repo.listarPlanesDeEstudio()).filter((p) => p.materiaIds.includes(materia.id));
    if (planes.length > 0) {
      throw new MateriaEnUsoError(
        `No se puede eliminar ${materia.nombre}: está en el plan ${planes.map((p) => p.clave).join(', ')}. Quítala primero del plan.`,
      );
    }

    await this.repo.eliminarMateria(materia.id);
    return materia;
  }

  // RN-29
  async registrarCarrera(sesion: Sesion, datos: DatosNuevaCarrera): Promise<Carrera> {
    await this.verificarAdministrador(sesion);

    if (!datos.clave || !datos.nombre) {
      throw new CarreraInvalidaError('debe tener clave y nombre');
    }

    const existente = await this.repo.buscarCarreraPorClave(datos.clave);
    if (existente) throw new ClaveDeCarreraDuplicadaError(datos.clave);

    return this.repo.crearCarrera({ clave: datos.clave, nombre: datos.nombre });
  }

  // RN-29
  async registrarPlanDeEstudios(sesion: Sesion, datos: DatosNuevoPlan): Promise<PlanDeEstudios> {
    await this.verificarAdministrador(sesion);

    const carrera = await this.repo.buscarCarreraPorId(datos.carreraId);
    if (!carrera) throw new CarreraNoEncontradaError(String(datos.carreraId));

    const existente = await this.repo.buscarPlanDeEstudiosPorClave(datos.clave);
    if (existente) throw new ClaveDePlanDuplicadaError(datos.clave);

    return this.repo.crearPlanDeEstudios({ clave: datos.clave, carreraId: carrera.id, materiaIds: [] });
  }

  // RN-30
  async agregarPrerrequisito(sesion: Sesion, materiaId: number, prerrequisitoId: number): Promise<Materia> {
    await this.verificarAdministrador(sesion);

    const materia = await this.repo.buscarMateriaPorId(materiaId);
    if (!materia) throw new MateriaNoEncontradaError(String(materiaId));

    const prerrequisito = await this.repo.buscarMateriaPorId(prerrequisitoId);
    if (!prerrequisito) throw new MateriaNoEncontradaError(String(prerrequisitoId));

    if (materia.prerrequisitoIds.includes(prerrequisitoId)) return materia;

    if (materiaId === prerrequisitoId) {
      throw new SeriacionInvalidaError(`La materia ${materia.nombre} no puede ser requisito de sí misma.`);
    }

    // Se recorren los requisitos del requisito (y los de esos, etc.).
    // Si en algún punto aparece la materia original, la seriación sería circular.
    const porRevisar = [...prerrequisito.prerrequisitoIds];
    const revisadas: number[] = [];
    while (porRevisar.length > 0) {
      const id = porRevisar.pop()!;
      if (id === materiaId) {
        throw new SeriacionInvalidaError(
          `No se puede seriar: ${prerrequisito.nombre} ya requiere (directa o indirectamente) a ${materia.nombre}.`,
        );
      }
      if (revisadas.includes(id)) continue;
      revisadas.push(id);

      const siguiente = await this.repo.buscarMateriaPorId(id);
      if (siguiente) porRevisar.push(...siguiente.prerrequisitoIds);
    }

    const actualizada: Materia = { ...materia, prerrequisitoIds: [...materia.prerrequisitoIds, prerrequisitoId] };
    await this.repo.actualizarMateria(actualizada);
    return actualizada;
  }

  // RN-30
  async quitarPrerrequisito(sesion: Sesion, materiaId: number, prerrequisitoId: number): Promise<Materia> {
    await this.verificarAdministrador(sesion);

    const materia = await this.repo.buscarMateriaPorId(materiaId);
    if (!materia) throw new MateriaNoEncontradaError(String(materiaId));

    const prerrequisito = await this.repo.buscarMateriaPorId(prerrequisitoId);
    if (!prerrequisito) throw new MateriaNoEncontradaError(String(prerrequisitoId));

    // Si no estaba ligada, no hay nada que quitar.
    if (!materia.prerrequisitoIds.includes(prerrequisitoId)) return materia;

    const actualizada: Materia = {
      ...materia,
      prerrequisitoIds: materia.prerrequisitoIds.filter((id) => id !== prerrequisitoId),
    };
    await this.repo.actualizarMateria(actualizada);
    return actualizada;
  }

  // RN-31
  async actualizarGrupo(sesion: Sesion, grupoId: number, cambios: CambiosDeGrupo): Promise<Grupo> {
    await this.verificarAdministrador(sesion);

    const grupo = await this.repo.buscarGrupoPorId(grupoId);
    if (!grupo) throw new GrupoNoEncontradoError(String(grupoId));

    const materia = await this.repo.buscarMateriaPorId(grupo.materiaId);
    const nombreDelGrupo = `${materia?.nombre ?? ''} ${grupo.clave}`;

    let cupoMaximo = grupo.cupoMaximo;
    if (cambios.cupoMaximo !== undefined) {
      if (cambios.cupoMaximo <= 0) throw new GrupoInvalidoError('el cupo debe ser mayor a cero');

      const inscritos = await this.repo.contarInscripcionesActivasDeGrupo(grupo.id);
      if (cambios.cupoMaximo < inscritos) {
        throw new CupoMenorAInscritosError(nombreDelGrupo, cambios.cupoMaximo, inscritos);
      }
      cupoMaximo = cambios.cupoMaximo;
    }

    let maestroId = grupo.maestroId;
    if (cambios.maestroId !== undefined && cambios.maestroId !== grupo.maestroId) {
      const maestro = await this.repo.buscarMaestroPorId(cambios.maestroId);
      if (!maestro) throw new MaestroNoEncontradoError(String(cambios.maestroId));

      const gruposDelMaestro = (await this.repo.listarGruposDeMaestro(maestro.id)).filter(
        (g) => g.periodoId === grupo.periodoId && g.id !== grupo.id,
      );
      for (const otroGrupo of gruposDelMaestro) {
        if (horariosSeEmpalman(grupo.horario, otroGrupo.horario)) {
          const otraMateria = await this.repo.buscarMateriaPorId(otroGrupo.materiaId);
          throw new EmpalmeDeMaestroError(maestro.nombre, `${otraMateria?.nombre ?? ''} (grupo ${otroGrupo.clave})`);
        }
      }
      maestroId = maestro.id;
    }

    const actualizado: Grupo = { ...grupo, cupoMaximo, maestroId };
    await this.repo.actualizarGrupo(actualizado);
    return actualizado;
  }

  // RN-35
  async eliminarGrupo(sesion: Sesion, grupoId: number): Promise<Grupo> {
    await this.verificarAdministrador(sesion);

    const grupo = await this.repo.buscarGrupoPorId(grupoId);
    if (!grupo) throw new GrupoNoEncontradoError(String(grupoId));

    const inscripciones = await this.repo.listarInscripcionesDeGrupo(grupo.id);
    if (inscripciones.length > 0) {
      throw new RegistroEnUsoError(
        'No se puede borrar el grupo porque ya tiene alumnos inscritos. Puedes cambiarle el cupo o el maestro.',
      );
    }

    await this.repo.eliminarGrupo(grupo.id);
    return grupo;
  }

  // RN-24 y RN-25
  async abrirGrupo(sesion: Sesion, datos: DatosNuevoGrupo): Promise<Grupo> {
    await this.verificarAdministrador(sesion);

    const materia = await this.repo.buscarMateriaPorId(datos.materiaId);
    if (!materia) throw new MateriaNoEncontradaError(String(datos.materiaId));

    const periodo = await this.repo.buscarPeriodoPorId(datos.periodoId);
    if (!periodo) throw new PeriodoNoEncontradoError(String(datos.periodoId));

    const maestro = await this.repo.buscarMaestroPorId(datos.maestroId);
    if (!maestro) throw new MaestroNoEncontradoError(String(datos.maestroId));

    if (!datos.clave || datos.cupoMaximo <= 0 || datos.horario.length === 0) {
      throw new GrupoInvalidoError('debe tener clave, cupo mayor a cero y al menos un bloque de horario');
    }

    const gruposDeLaMateria = await this.repo.listarGruposDeMateriaEnPeriodo(materia.id, periodo.id);
    if (gruposDeLaMateria.some((g) => g.clave === datos.clave)) {
      throw new GrupoDuplicadoError(`${materia.nombre} ${datos.clave}`, periodo.clave);
    }

    // Un maestro no puede estar en dos grupos a la misma hora.
    const gruposDelMaestro = (await this.repo.listarGruposDeMaestro(maestro.id)).filter(
      (g) => g.periodoId === periodo.id,
    );
    for (const otroGrupo of gruposDelMaestro) {
      if (horariosSeEmpalman(datos.horario, otroGrupo.horario)) {
        const otraMateria = await this.repo.buscarMateriaPorId(otroGrupo.materiaId);
        throw new EmpalmeDeMaestroError(maestro.nombre, `${otraMateria?.nombre ?? ''} (grupo ${otroGrupo.clave})`);
      }
    }

    return this.repo.crearGrupo(datos);
  }

  async consultarOcupacionDeGrupo(
    sesion: Sesion,
    grupoId: number,
  ): Promise<{ ocupados: number; disponibles: number }> {
    await this.verificarAdministrador(sesion);

    const grupo = await this.repo.buscarGrupoPorId(grupoId);
    if (!grupo) throw new GrupoNoEncontradoError(String(grupoId));

    const ocupados = await this.repo.contarInscripcionesActivasDeGrupo(grupo.id);
    return { ocupados, disponibles: grupo.cupoMaximo - ocupados };
  }

  async consultarInscritosDeGrupo(sesion: Sesion, grupoId: number): Promise<AlumnoEnLista[]> {
    await this.verificarAdministrador(sesion);

    const grupo = await this.repo.buscarGrupoPorId(grupoId);
    if (!grupo) throw new GrupoNoEncontradoError(String(grupoId));

    return alumnosInscritosEnGrupo(this.repo, grupo.id);
  }

  // PERIODOS

  // RN-27
  async crearPeriodo(sesion: Sesion, datos: DatosNuevoPeriodo): Promise<PeriodoEscolar> {
    await this.verificarAdministrador(sesion);

    if (!datos.clave || datos.creditosMaximos <= 0) {
      throw new PeriodoInvalidoError('debe tener clave y un tope de creditos mayor a cero');
    }
    if (datos.fechaCierreCarga <= datos.fechaAperturaCarga) {
      throw new PeriodoInvalidoError('la fecha de cierre debe ser despues de la de apertura');
    }

    const existente = await this.repo.buscarPeriodoPorClave(datos.clave);
    if (existente) throw new ClaveDePeriodoDuplicadaError(datos.clave);

    return this.repo.crearPeriodo({ ...datos, habilitado: false });
  }

  // RN-07
  async abrirCargaAcademica(sesion: Sesion, periodoId: number): Promise<PeriodoEscolar> {
    await this.verificarAdministrador(sesion);

    const periodoAbierto = await this.repo.buscarPeriodoConCargaAbierta();
    if (periodoAbierto && periodoAbierto.id !== periodoId) {
      throw new YaExistePeriodoAbiertoError(String(periodoAbierto.id));
    }

    const periodo = await this.repo.buscarPeriodoPorId(periodoId);
    if (!periodo) throw new PeriodoNoEncontradoError(String(periodoId));

    const actualizado: PeriodoEscolar = { ...periodo, habilitado: true };
    await this.repo.actualizarPeriodo(actualizado);
    return actualizado;
  }

  async cerrarCargaAcademica(sesion: Sesion, periodoId: number): Promise<PeriodoEscolar> {
    await this.verificarAdministrador(sesion);

    const periodo = await this.repo.buscarPeriodoPorId(periodoId);
    if (!periodo) throw new PeriodoNoEncontradoError(String(periodoId));

    const actualizado: PeriodoEscolar = { ...periodo, habilitado: false };
    await this.repo.actualizarPeriodo(actualizado);
    return actualizado;
  }

  async obtenerPeriodo(sesion: Sesion, periodoId: number): Promise<PeriodoEscolar> {
    await this.verificarAdministrador(sesion);

    const periodo = await this.repo.buscarPeriodoPorId(periodoId);
    if (!periodo) throw new PeriodoNoEncontradoError(String(periodoId));
    return periodo;
  }

  async editarPeriodo(sesion: Sesion, periodoId: number, datos: DatosNuevoPeriodo): Promise<PeriodoEscolar> {
    const periodo = await this.obtenerPeriodo(sesion, periodoId);

    if (!datos.clave || datos.creditosMaximos <= 0) {
      throw new PeriodoInvalidoError('debe tener clave y un tope de creditos mayor a cero');
    }
    if (datos.fechaCierreCarga <= datos.fechaAperturaCarga) {
      throw new PeriodoInvalidoError('la fecha de cierre debe ser despues de la de apertura');
    }

    if (datos.clave !== periodo.clave) {
      const existente = await this.repo.buscarPeriodoPorClave(datos.clave);
      if (existente) throw new ClaveDePeriodoDuplicadaError(datos.clave);
    }

    const actualizado: PeriodoEscolar = { ...periodo, ...datos };
    await this.repo.actualizarPeriodo(actualizado);
    return actualizado;
  }

  // RN-34
  async eliminarPeriodo(sesion: Sesion, periodoId: number): Promise<PeriodoEscolar> {
    const periodo = await this.obtenerPeriodo(sesion, periodoId);

    const grupos = await this.repo.listarGruposDePeriodo(periodo.id);
    if (grupos.length > 0) {
      throw new RegistroEnUsoError(
        `No se puede eliminar el periodo ${periodo.clave}: tiene ${grupos.length} grupo(s) registrados.`,
      );
    }

    const avisos = await this.repo.listarAvisosDePeriodo(periodo.id);
    if (avisos.length > 0) {
      throw new RegistroEnUsoError(
        `No se puede eliminar el periodo ${periodo.clave}: tiene ${avisos.length} aviso(s) publicados.`,
      );
    }

    const pagos = (await this.repo.listarPagos()).filter((p) => p.periodoId === periodo.id);
    if (pagos.length > 0) {
      throw new RegistroEnUsoError(
        `No se puede eliminar el periodo ${periodo.clave}: tiene ${pagos.length} pago(s) registrados.`,
      );
    }

    if (periodo.habilitado) {
      throw new RegistroEnUsoError(
        `No se puede eliminar el periodo ${periodo.clave}: tiene la carga académica abierta. Ciérrala primero.`,
      );
    }

    await this.repo.eliminarPeriodo(periodo.id);
    return periodo;
  }

  async publicarAviso(sesion: Sesion, periodoId: number, titulo: string, contenido: string): Promise<Aviso> {
    await this.verificarAdministrador(sesion);

    const periodo = await this.repo.buscarPeriodoPorId(periodoId);
    if (!periodo) throw new PeriodoNoEncontradoError(String(periodoId));

    return this.repo.crearAviso({ titulo, contenido, periodoId, fechaPublicacion: new Date() });
  }

  async obtenerAviso(sesion: Sesion, avisoId: number): Promise<Aviso> {
    await this.verificarAdministrador(sesion);

    const aviso = await this.repo.buscarAvisoPorId(avisoId);
    if (!aviso) throw new AvisoNoEncontradoError(String(avisoId));
    return aviso;
  }

  async editarAviso(sesion: Sesion, avisoId: number, titulo: string, contenido: string): Promise<Aviso> {
    const aviso = await this.obtenerAviso(sesion, avisoId);

    const actualizado: Aviso = { ...aviso, titulo, contenido };
    await this.repo.actualizarAviso(actualizado);
    return actualizado;
  }

  async eliminarAviso(sesion: Sesion, avisoId: number): Promise<Aviso> {
    const aviso = await this.obtenerAviso(sesion, avisoId);

    await this.repo.eliminarAviso(aviso.id);
    return aviso;
  }

  // PAGOS

  // RN-26
  async registrarCargo(sesion: Sesion, datos: DatosNuevoCargo): Promise<Pago> {
    await this.verificarAdministrador(sesion);

    if (datos.monto <= 0) throw new PagoInvalidoError('el monto debe ser mayor a cero');

    const alumno = await this.repo.buscarAlumnoPorId(datos.alumnoId);
    if (!alumno) throw new AlumnoNoEncontradoError(String(datos.alumnoId));

    const periodo = await this.repo.buscarPeriodoPorId(datos.periodoId);
    if (!periodo) throw new PeriodoNoEncontradoError(String(datos.periodoId));

    return this.repo.crearPago({ ...datos, estado: 'pendiente', fechaPago: null });
  }

  // RN-26
  async registrarPago(sesion: Sesion, pagoId: number): Promise<Pago> {
    await this.verificarAdministrador(sesion);

    const pago = await this.repo.buscarPagoPorId(pagoId);
    if (!pago) throw new PagoNoEncontradoError(String(pagoId));
    if (pago.estado === 'pagado') throw new PagoYaRegistradoError(String(pagoId));

    const actualizado: Pago = { ...pago, estado: 'pagado', fechaPago: new Date() };
    await this.repo.actualizarPago(actualizado);
    return actualizado;
  }

  async listarPagos(sesion: Sesion): Promise<Pago[]> {
    await this.verificarAdministrador(sesion);
    return this.repo.listarPagos();
  }

  // TABLERO

  async resumen(sesion: Sesion): Promise<ResumenDelPanel> {
    await this.verificarAdministrador(sesion);

    const alumnos = await this.repo.listarAlumnos();
    const maestros = await this.repo.listarMaestros();

    let pagosPendientes = 0;
    let pagosVencidos = 0;
    const hoy = new Date();
    for (const pago of await this.repo.listarPagos()) {
      if (pago.estado !== 'pendiente') continue;
      pagosPendientes++;
      if (pago.fechaLimite < hoy) pagosVencidos++;
    }

    const periodo = await this.repo.buscarPeriodoConCargaAbierta();
    const grupos: OcupacionDeGrupo[] = [];
    if (periodo) {
      for (const grupo of await this.repo.listarGruposDePeriodo(periodo.id)) {
        const materia = await this.repo.buscarMateriaPorId(grupo.materiaId);
        grupos.push({
          grupoId: grupo.id,
          materiaNombre: materia?.nombre ?? '',
          grupoClave: grupo.clave,
          inscritos: await this.repo.contarInscripcionesActivasDeGrupo(grupo.id),
          cupoMaximo: grupo.cupoMaximo,
        });
      }
    }

    return {
      periodoAbierto: periodo ? periodo.clave : null,
      totalAlumnos: alumnos.length,
      totalMaestros: maestros.length,
      pagosPendientes,
      pagosVencidos,
      grupos,
    };
  }

  // RN-08
  private async verificarAdministrador(sesion: Sesion): Promise<void> {
    exigirRol(sesion, 'administrador');
    const admin = await this.repo.buscarAdministradorPorId(sesion.personaId);
    if (!admin) throw new OperacionNoAutorizadaError();
  }

  // RN-20
  private async prepararCuenta(correo: string, contrasena: string): Promise<DatosDeCuenta> {
    const correoNormalizado = correo.trim().toLowerCase();
    const existente = await this.repo.buscarUsuarioPorCorreo(correoNormalizado);
    if (existente) throw new CorreoDuplicadoError(correoNormalizado);

    if (contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
      throw new ContrasenaDebilError(LONGITUD_MINIMA_CONTRASENA);
    }

    return { correoInstitucional: correoNormalizado, contrasenaHash: await this.hash.generar(contrasena) };
  }
}
