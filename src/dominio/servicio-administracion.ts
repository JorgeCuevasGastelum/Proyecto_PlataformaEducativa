import { LONGITUD_MINIMA_CONTRASENA } from './entidades.js';
import type {
  Alumno,
  AlumnoEnLista,
  Aviso,
  BloqueHorario,
  ConceptoDePago,
  Grupo,
  Maestro,
  Materia,
  Pago,
  PeriodoEscolar,
  PlanDeEstudios,
  Rol,
  Sesion,
} from './entidades.js';
import {
  AlumnoInvalidoError,
  AlumnoNoEncontradoError,
  ClaveDeMateriaDuplicadaError,
  ClaveDePeriodoDuplicadaError,
  ContrasenaDebilError,
  CorreoDuplicadoError,
  EmpalmeDeMaestroError,
  GrupoDuplicadoError,
  GrupoInvalidoError,
  GrupoNoEncontradoError,
  MaestroInvalidoError,
  MaestroNoEncontradoError,
  MateriaInvalidaError,
  MateriaNoEncontradaError,
  MatriculaDuplicadaError,
  NumeroEmpleadoDuplicadoError,
  OperacionNoAutorizadaError,
  PagoInvalidoError,
  PagoNoEncontradoError,
  PagoYaRegistradoError,
  PeriodoInvalidoError,
  PeriodoNoEncontradoError,
  PlanDeEstudiosNoEncontradoError,
  YaExistePeriodoAbiertoError,
} from './errores.js';
import type { GeneradorDeHash } from './generador-de-hash.js';
import type { RepositorioAcademico } from './repositorio-academico.js';
import { alumnosInscritosEnGrupo } from './consultas.js';
import { exigirRol, horariosSeEmpalman } from './reglas.js';

interface DatosNuevaMateria {
  clave: string;
  nombre: string;
  descripcion: string;
  creditos: number;
  prerrequisitoIds: number[];
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

  // PERSONAS Y CUENTSA

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

    const { correo, contrasenaHash } = await this.prepararCuenta(datos.correoInstitucional, datos.contrasena);

    const alumno = await this.repo.crearAlumno({
      matricula: datos.matricula,
      nombre: datos.nombre,
      planDeEstudiosId: plan.id,
    });
    await this.crearUsuario(correo, contrasenaHash, 'alumno', alumno.id);
    return alumno;
  }

  // RN-13
  async registrarMaestro(sesion: Sesion, datos: DatosNuevoMaestro): Promise<Maestro> {
    await this.verificarAdministrador(sesion);

    if (!datos.numeroEmpleado || !datos.nombre || !datos.correoInstitucional) {
      throw new MaestroInvalidoError('faltan datos obligatorios');
    }

    const existente = await this.repo.buscarMaestroPorNumeroEmpleado(datos.numeroEmpleado);
    if (existente) throw new NumeroEmpleadoDuplicadoError(datos.numeroEmpleado);

    const { correo, contrasenaHash } = await this.prepararCuenta(datos.correoInstitucional, datos.contrasena);

    const maestro = await this.repo.crearMaestro({ numeroEmpleado: datos.numeroEmpleado, nombre: datos.nombre });
    await this.crearUsuario(correo, contrasenaHash, 'maestro', maestro.id);
    return maestro;
  }

  async listarAlumnos(sesion: Sesion): Promise<Alumno[]> {
    await this.verificarAdministrador(sesion);
    return this.repo.listarAlumnos();
  }

  async listarMaestros(sesion: Sesion): Promise<Maestro[]> {
    await this.verificarAdministrador(sesion);
    return this.repo.listarMaestros();
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

  async publicarAviso(sesion: Sesion, periodoId: number, titulo: string, contenido: string): Promise<Aviso> {
    await this.verificarAdministrador(sesion);

    const periodo = await this.repo.buscarPeriodoPorId(periodoId);
    if (!periodo) throw new PeriodoNoEncontradoError(String(periodoId));

    return this.repo.crearAviso({ titulo, contenido, periodoId, fechaPublicacion: new Date() });
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

  // RN-08
  private async verificarAdministrador(sesion: Sesion): Promise<void> {
    exigirRol(sesion, 'administrador');
    const admin = await this.repo.buscarAdministradorPorId(sesion.personaId);
    if (!admin) throw new OperacionNoAutorizadaError();
  }

  // RN-20
  private async prepararCuenta(correo: string, contrasena: string): Promise<{ correo: string; contrasenaHash: string }> {
    const correoNormalizado = correo.trim().toLowerCase();
    const existente = await this.repo.buscarUsuarioPorCorreo(correoNormalizado);
    if (existente) throw new CorreoDuplicadoError(correoNormalizado);

    if (contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
      throw new ContrasenaDebilError(LONGITUD_MINIMA_CONTRASENA);
    }

    return { correo: correoNormalizado, contrasenaHash: await this.hash.generar(contrasena) };
  }

  private async crearUsuario(correo: string, contrasenaHash: string, rol: Rol, personaId: number): Promise<void> {
    await this.repo.crearUsuario({ correoInstitucional: correo, contrasenaHash, rol, personaId });
  }
}
