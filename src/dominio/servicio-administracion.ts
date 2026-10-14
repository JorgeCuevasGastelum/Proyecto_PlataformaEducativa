import { ServicioRegistro } from './servicio-registro.js';
import type { DatosNuevoAlumno, DatosNuevoMaestro } from './servicio-registro.js';
import type {
  Alumno,
  Aviso,
  BloqueHorario,
  ConceptoDePago,
  Grupo,
  Maestro,
  Materia,
  Pago,
  PeriodoEscolar,
  PlanDeEstudios,
  Sesion,
} from './entidades.js';
import {
  AlumnoNoEncontradoError,
  ClaveDeMateriaDuplicadaError,
  EmpalmeDeMaestroError,
  GrupoDuplicadoError,
  GrupoInvalidoError,
  GrupoNoEncontradoError,
  MaestroNoEncontradoError,
  MateriaInvalidaError,
  MateriaNoEncontradaError,
  OperacionNoAutorizadaError,
  PagoInvalidoError,
  PagoNoEncontradoError,
  PagoYaRegistradoError,
  PeriodoNoEncontradoError,
  PlanDeEstudiosNoEncontradoError,
  YaExistePeriodoAbiertoError,
} from './errores.js';
import type { GeneradorDeHash } from './generador-de-hash.js';
import type { RepositorioAcademico } from './repositorio-academico.js';
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

  // --- Personas y cuentas ---

  async registrarAlumno(sesion: Sesion, datos: DatosNuevoAlumno): Promise<Alumno> {
    await this.verificarAdministrador(sesion);
    return new ServicioRegistro(this.repo, this.hash).registrarAlumno(datos);
  }

  async registrarMaestro(sesion: Sesion, datos: DatosNuevoMaestro): Promise<Maestro> {
    await this.verificarAdministrador(sesion);
    return new ServicioRegistro(this.repo, this.hash).registrarMaestro(datos);
  }

  // --- Catalogo: materias, planes y grupos ---

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

  // --- Periodos ---

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

  // --- Pagos ---

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

}
