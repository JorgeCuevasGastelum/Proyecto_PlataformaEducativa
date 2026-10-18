import { CALIFICACION_MAXIMA, CALIFICACION_MINIMA } from './entidades.js';
import type {
  AlumnoEnLista,
  CapturaDeCalificacion,
  Grupo,
  GrupoDelMaestro,
  Inscripcion,
  Maestro,
  Sesion,
} from './entidades.js';
import {
  CalificacionInvalidaError,
  CargaAunAbiertaError,
  GrupoAjenoError,
  GrupoNoEncontradoError,
  InscripcionNoEncontradaError,
  InscripcionYaDadaDeBajaError,
  MaestroNoEncontradoError,
  PeriodoNoEncontradoError,
} from './errores.js';
import type { RepositorioAcademico } from './repositorio-academico.js';
import { alumnosInscritosEnGrupo } from './consultas.js';
import { cargaEstaAbierta, exigirRol } from './reglas.js';

export class ServicioMaestro {
  constructor(private readonly repo: RepositorioAcademico) {}

  async consultarMisGrupos(sesion: Sesion): Promise<GrupoDelMaestro[]> {
    const maestro = await this.obtenerMaestro(sesion);
    const grupos = await this.repo.listarGruposDeMaestro(maestro.id);

    const resultado: GrupoDelMaestro[] = [];
    for (const grupo of grupos) {
      const materia = await this.repo.buscarMateriaPorId(grupo.materiaId);
      const periodo = await this.repo.buscarPeriodoPorId(grupo.periodoId);
      resultado.push({
        grupoId: grupo.id,
        grupoClave: grupo.clave,
        materiaNombre: materia?.nombre ?? String(grupo.materiaId),
        periodoClave: periodo?.clave ?? String(grupo.periodoId),
        inscritos: await this.repo.contarInscripcionesActivasDeGrupo(grupo.id),
      });
    }
    return resultado;
  }

  async consultarListaDeGrupo(sesion: Sesion, grupoId: number): Promise<AlumnoEnLista[]> {
    const maestro = await this.obtenerMaestro(sesion);
    const grupo = await this.obtenerGrupoPropio(maestro, grupoId);
    return alumnosInscritosEnGrupo(this.repo, grupo.id);
  }

  // Se validan todas las calificaciones antes de guardar cualquiera, para no dejar una captura a medias.
  async capturarCalificaciones(
    sesion: Sesion,
    grupoId: number,
    capturas: CapturaDeCalificacion[],
  ): Promise<Inscripcion[]> {
    const maestro = await this.obtenerMaestro(sesion);
    const grupo = await this.obtenerGrupoPropio(maestro, grupoId);

    // RN-23
    const periodo = await this.repo.buscarPeriodoPorId(grupo.periodoId);
    if (!periodo) throw new PeriodoNoEncontradoError(String(grupo.periodoId));
    if (cargaEstaAbierta(periodo)) throw new CargaAunAbiertaError(periodo.clave);

    // RN-22
    const actualizadas: Inscripcion[] = [];
    for (const { inscripcionId, calificacion } of capturas) {
      if (!Number.isInteger(calificacion) || calificacion < CALIFICACION_MINIMA || calificacion > CALIFICACION_MAXIMA) {
        throw new CalificacionInvalidaError(calificacion, CALIFICACION_MINIMA, CALIFICACION_MAXIMA);
      }

      const inscripcion = await this.repo.buscarInscripcionPorId(inscripcionId);
      if (!inscripcion || inscripcion.grupoId !== grupo.id) {
        throw new InscripcionNoEncontradaError(String(inscripcionId));
      }
      if (inscripcion.estadoActual === 'baja') throw new InscripcionYaDadaDeBajaError(String(inscripcionId));

      actualizadas.push({ ...inscripcion, calificacion });
    }

    for (const inscripcion of actualizadas) {
      await this.repo.actualizarInscripcion(inscripcion);
    }
    return actualizadas;
  }

  private async obtenerMaestro(sesion: Sesion): Promise<Maestro> {
    exigirRol(sesion, 'maestro');
    const maestro = await this.repo.buscarMaestroPorId(sesion.personaId);
    if (!maestro) throw new MaestroNoEncontradoError(String(sesion.personaId));
    return maestro;
  }

  // RN-21
  private async obtenerGrupoPropio(maestro: Maestro, grupoId: number): Promise<Grupo> {
    const grupo = await this.repo.buscarGrupoPorId(grupoId);
    if (!grupo) throw new GrupoNoEncontradoError(String(grupoId));
    if (grupo.maestroId !== maestro.id) {
      const materia = await this.repo.buscarMateriaPorId(grupo.materiaId);
      throw new GrupoAjenoError(`${materia?.nombre ?? grupo.materiaId} (grupo ${grupo.clave})`);
    }
    return grupo;
  }
}
