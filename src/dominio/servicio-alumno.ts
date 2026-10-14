import type {
  Alumno,
  Aviso,
  Grupo,
  Historial,
  Inscripcion,
  Materia,
  MateriaCursada,
  MateriaInscrita,
  Pago,
  PeriodoEscolar,
  RenglonDeHorario,
  Sesion,
} from './entidades.js';
import {
  AdeudoVencidoError,
  AlumnoNoEncontradoError,
  CupoAgotadoError,
  EmpalmeDeHorarioError,
  GrupoFueraDePeriodoError,
  GrupoNoEncontradoError,
  InscripcionNoEncontradaError,
  InscripcionYaCalificadaError,
  InscripcionYaDadaDeBajaError,
  LimiteDeCreditosExcedidoError,
  MateriaFueraDelPlanError,
  MateriaNoEncontradaError,
  MateriaYaAprobadaError,
  MateriaYaInscritaError,
  PagoDeInscripcionPendienteError,
  PeriodoDeCargaCerradoError,
  PlanDeEstudiosNoEncontradoError,
  SeriacionNoCumplidaError,
} from './errores.js';
import type { RepositorioAcademico } from './repositorio-academico.js';
import {
  calificacionAprobatoria,
  cargaEstaAbierta,
  compararPorDiaYHora,
  estaAprobada,
  exigirRol,
  horariosSeEmpalman,
  pagoEstaVencido,
} from './reglas.js';

interface InscripcionConGrupo {
  inscripcion: Inscripcion;
  grupo: Grupo;
}

interface InscripcionCompleta extends InscripcionConGrupo {
  materia: Materia;
}

function nombreDeGrupo(materia: Materia, grupo: Grupo): string {
  return `${materia.nombre} (grupo ${grupo.clave})`;
}

export class ServicioAlumno {
  constructor(private readonly repo: RepositorioAcademico) {}

  async realizarCargaAcademica(sesion: Sesion, grupoId: number): Promise<Inscripcion> {
    const alumno = await this.obtenerAlumno(sesion);

    const grupo = await this.repo.buscarGrupoPorId(grupoId);
    if (!grupo) throw new GrupoNoEncontradoError(String(grupoId));
    const materia = await this.obtenerMateria(grupo.materiaId);

    // RN-01
    const periodo = await this.repo.buscarPeriodoConCargaAbierta();
    if (!periodo || !cargaEstaAbierta(periodo)) throw new PeriodoDeCargaCerradoError();
    if (grupo.periodoId !== periodo.id) {
      throw new GrupoFueraDePeriodoError(nombreDeGrupo(materia, grupo), periodo.clave);
    }

    await this.verificarPagos(alumno, periodo);
    await this.verificarQueEsteEnSuPlan(alumno, materia);

    const cursadas = await this.inscripcionesConGrupo(alumno.id);
    await this.verificarSeriacion(materia, cursadas);

    // RN-04
    const activasDelPeriodo = cursadas.filter(
      (c) => c.grupo.periodoId === periodo.id && c.inscripcion.estadoActual === 'activa',
    );
    if (activasDelPeriodo.some((c) => c.grupo.materiaId === materia.id)) {
      throw new MateriaYaInscritaError(materia.nombre);
    }

    // RN-02
    const inscritosEnGrupo = await this.repo.contarInscripcionesActivasDeGrupo(grupo.id);
    if (inscritosEnGrupo >= grupo.cupoMaximo) {
      throw new CupoAgotadoError(nombreDeGrupo(materia, grupo));
    }

    // RN-03 y RN-05
    let creditosAcumulados = materia.creditos;
    for (const { grupo: grupoInscrito } of activasDelPeriodo) {
      const materiaInscrita = await this.obtenerMateria(grupoInscrito.materiaId);
      if (horariosSeEmpalman(grupo.horario, grupoInscrito.horario)) {
        throw new EmpalmeDeHorarioError(nombreDeGrupo(materia, grupo), nombreDeGrupo(materiaInscrita, grupoInscrito));
      }
      creditosAcumulados += materiaInscrita.creditos;
    }

    if (creditosAcumulados > periodo.creditosMaximos) {
      throw new LimiteDeCreditosExcedidoError(periodo.creditosMaximos);
    }

    return this.repo.crearInscripcion({
      alumnoId: alumno.id,
      grupoId: grupo.id,
      fechaRegistro: new Date(),
      estadoActual: 'activa',
      calificacion: null,
    });
  }

  // RN-10
  async darDeBajaInscripcion(sesion: Sesion, inscripcionId: number): Promise<Inscripcion> {
    const alumno = await this.obtenerAlumno(sesion);

    // Una inscripcion de otro alumno se trata igual que una que no existe.
    const inscripcion = await this.repo.buscarInscripcionPorId(inscripcionId);
    if (!inscripcion || inscripcion.alumnoId !== alumno.id) {
      throw new InscripcionNoEncontradaError(String(inscripcionId));
    }
    if (inscripcion.estadoActual === 'baja') throw new InscripcionYaDadaDeBajaError(String(inscripcionId));
    if (inscripcion.calificacion !== null) throw new InscripcionYaCalificadaError(String(inscripcionId));

    const grupo = await this.repo.buscarGrupoPorId(inscripcion.grupoId);
    const periodo = grupo ? await this.repo.buscarPeriodoPorId(grupo.periodoId) : null;
    if (!periodo || !cargaEstaAbierta(periodo)) throw new PeriodoDeCargaCerradoError();

    const actualizada: Inscripcion = { ...inscripcion, estadoActual: 'baja' };
    await this.repo.actualizarInscripcion(actualizada);
    return actualizada;
  }

  async consultarMateriasInscritas(sesion: Sesion): Promise<MateriaInscrita[]> {
    const alumno = await this.obtenerAlumno(sesion);
    const carga = await this.cargaDelPeriodoActual(alumno.id);
    return carga.map(({ inscripcion, grupo, materia }) => ({
      inscripcionId: inscripcion.id,
      materiaClave: materia.clave,
      materiaNombre: materia.nombre,
      grupoClave: grupo.clave,
      creditos: materia.creditos,
    }));
  }

  async consultarHorarioSemanal(sesion: Sesion): Promise<RenglonDeHorario[]> {
    const alumno = await this.obtenerAlumno(sesion);
    const carga = await this.cargaDelPeriodoActual(alumno.id);

    const renglones: RenglonDeHorario[] = [];
    for (const { grupo, materia } of carga) {
      const maestro = await this.repo.buscarMaestroPorId(grupo.maestroId);
      for (const bloque of grupo.horario) {
        renglones.push({
          diaSemana: bloque.diaSemana,
          minutoInicio: bloque.minutoInicio,
          minutoFin: bloque.minutoFin,
          materiaNombre: materia.nombre,
          grupoClave: grupo.clave,
          maestroNombre: maestro?.nombre ?? 'Sin asignar',
        });
      }
    }
    return renglones.sort(compararPorDiaYHora);
  }

  // RN-11: el historial solo incluye las materias que se cursaron; las bajas no aparecen.
  async consultarHistorial(sesion: Sesion): Promise<Historial[]> {
    const alumno = await this.obtenerAlumno(sesion);
    const cursadas = (await this.inscripcionesConGrupo(alumno.id)).filter(
      (c) => c.inscripcion.estadoActual === 'activa',
    );

    const materiasPorPeriodo = new Map<number, MateriaCursada[]>();
    for (const { inscripcion, grupo } of cursadas) {
      const materia = await this.obtenerMateria(grupo.materiaId);
      const lista = materiasPorPeriodo.get(grupo.periodoId) ?? [];
      lista.push({
        materiaClave: materia.clave,
        materiaNombre: materia.nombre,
        creditos: materia.creditos,
        grupoClave: grupo.clave,
        calificacion: inscripcion.calificacion,
        aprobada: inscripcion.calificacion === null ? null : calificacionAprobatoria(inscripcion.calificacion),
      });
      materiasPorPeriodo.set(grupo.periodoId, lista);
    }

    const periodos: { periodo: PeriodoEscolar; materias: MateriaCursada[] }[] = [];
    for (const [periodoId, materias] of materiasPorPeriodo) {
      const periodo = await this.repo.buscarPeriodoPorId(periodoId);
      if (periodo) periodos.push({ periodo, materias });
    }
    return periodos
      .sort((a, b) => a.periodo.fechaAperturaCarga.getTime() - b.periodo.fechaAperturaCarga.getTime())
      .map(({ periodo, materias }) => ({ periodoClave: periodo.clave, materias }));
  }

  async consultarEstadoDeCuenta(sesion: Sesion): Promise<Pago[]> {
    const alumno = await this.obtenerAlumno(sesion);
    return this.repo.listarPagosDeAlumno(alumno.id);
  }

  async consultarAvisos(periodoId: number): Promise<Aviso[]> {
    return this.repo.listarAvisosDePeriodo(periodoId);
  }

  private async obtenerAlumno(sesion: Sesion): Promise<Alumno> {
    exigirRol(sesion, 'alumno');
    const alumno = await this.repo.buscarAlumnoPorId(sesion.personaId);
    if (!alumno) throw new AlumnoNoEncontradoError(String(sesion.personaId));
    return alumno;
  }

  private async obtenerMateria(materiaId: number): Promise<Materia> {
    const materia = await this.repo.buscarMateriaPorId(materiaId);
    if (!materia) throw new MateriaNoEncontradaError(String(materiaId));
    return materia;
  }

  // RN-17 y RN-18: hay que tener pagada la inscripcion del periodo y ningun cargo vencido.
  private async verificarPagos(alumno: Alumno, periodo: PeriodoEscolar): Promise<void> {
    const pagos = await this.repo.listarPagosDeAlumno(alumno.id);

    const inscripcionPagada = pagos.some(
      (p) => p.periodoId === periodo.id && p.concepto === 'inscripcion' && p.estado === 'pagado',
    );
    if (!inscripcionPagada) throw new PagoDeInscripcionPendienteError(periodo.clave);

    const vencido = pagos.find((p) => pagoEstaVencido(p));
    if (vencido) throw new AdeudoVencidoError(vencido.concepto, vencido.fechaLimite);
  }

  // RN-16
  private async verificarQueEsteEnSuPlan(alumno: Alumno, materia: Materia): Promise<void> {
    const plan = await this.repo.buscarPlanDeEstudiosPorId(alumno.planDeEstudiosId);
    if (!plan) throw new PlanDeEstudiosNoEncontradoError(String(alumno.planDeEstudiosId));
    if (!plan.materiaIds.includes(materia.id)) {
      const carrera = await this.repo.buscarCarreraPorId(plan.carreraId);
      throw new MateriaFueraDelPlanError(materia.nombre, `${plan.clave}${carrera ? `, ${carrera.nombre}` : ''}`);
    }
  }

  // RN-15: no se puede volver a inscribir una materia aprobada.
  // RN-14: ni inscribir una cuyos prerrequisitos no estén aprobados.
  private async verificarSeriacion(materia: Materia, cursadas: InscripcionConGrupo[]): Promise<void> {
    const aprobo = (materiaId: number) =>
      cursadas.some((c) => c.grupo.materiaId === materiaId && estaAprobada(c.inscripcion));

    if (aprobo(materia.id)) throw new MateriaYaAprobadaError(materia.nombre);

    for (const prerrequisitoId of materia.prerrequisitoIds) {
      if (!aprobo(prerrequisitoId)) {
        const prerrequisito = await this.obtenerMateria(prerrequisitoId);
        throw new SeriacionNoCumplidaError(materia.nombre, prerrequisito.nombre);
      }
    }
  }

  private async inscripcionesConGrupo(alumnoId: number): Promise<InscripcionConGrupo[]> {
    const inscripciones = await this.repo.listarInscripcionesDeAlumno(alumnoId);
    const resultado: InscripcionConGrupo[] = [];
    for (const inscripcion of inscripciones) {
      const grupo = await this.repo.buscarGrupoPorId(inscripcion.grupoId);
      if (grupo) resultado.push({ inscripcion, grupo });
    }
    return resultado;
  }

  private async cargaDelPeriodoActual(alumnoId: number): Promise<InscripcionCompleta[]> {
    const periodo = await this.repo.buscarPeriodoConCargaAbierta();
    if (!periodo) return [];

    const carga: InscripcionCompleta[] = [];
    for (const { inscripcion, grupo } of await this.inscripcionesConGrupo(alumnoId)) {
      if (grupo.periodoId !== periodo.id || inscripcion.estadoActual !== 'activa') continue;
      carga.push({ inscripcion, grupo, materia: await this.obtenerMateria(grupo.materiaId) });
    }
    return carga;
  }
}
