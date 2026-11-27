import type { Carrera, Grupo, GrupoDeCatalogo, Materia, PeriodoEscolar, PlanDeEstudios } from './entidades.js';
import { GrupoNoEncontradoError, PeriodoNoEncontradoError } from './errores.js';
import type { RepositorioAcademico } from './repositorio-academico.js';

export class ServicioCatalogo {
  constructor(private readonly repo: RepositorioAcademico) {}

  listarCarreras(): Promise<Carrera[]> {
    return this.repo.listarCarreras();
  }

  listarPlanesDeEstudio(): Promise<PlanDeEstudios[]> {
    return this.repo.listarPlanesDeEstudio();
  }

  listarMaterias(): Promise<Materia[]> {
    return this.repo.listarMaterias();
  }

  listarPeriodos(): Promise<PeriodoEscolar[]> {
    return this.repo.listarPeriodos();
  }

  async consultarGrupos(periodoId?: number): Promise<GrupoDeCatalogo[]> {
    const periodo = periodoId
      ? await this.repo.buscarPeriodoPorId(periodoId)
      : await this.repo.buscarPeriodoConCargaAbierta();
    if (!periodo) {
      if (periodoId) throw new PeriodoNoEncontradoError(String(periodoId));
      return [];
    }

    const resultado: GrupoDeCatalogo[] = [];
    for (const grupo of await this.repo.listarGruposDePeriodo(periodo.id)) {
      resultado.push(await this.armarGrupo(grupo, periodo.clave));
    }
    return resultado;
  }

  // Un solo grupo, con los mismos datos que la lista (lo usa el detalle del panel).
  async obtenerGrupo(grupoId: number): Promise<GrupoDeCatalogo> {
    const grupo = await this.repo.buscarGrupoPorId(grupoId);
    if (!grupo) throw new GrupoNoEncontradoError(String(grupoId));
    const periodo = await this.repo.buscarPeriodoPorId(grupo.periodoId);
    return this.armarGrupo(grupo, periodo?.clave ?? '');
  }

  private async armarGrupo(grupo: Grupo, periodoClave: string): Promise<GrupoDeCatalogo> {
    const materia = await this.repo.buscarMateriaPorId(grupo.materiaId);
    const maestro = await this.repo.buscarMaestroPorId(grupo.maestroId);
    const ocupados = await this.repo.contarInscripcionesActivasDeGrupo(grupo.id);
    return {
      grupoId: grupo.id,
      grupoClave: grupo.clave,
      materiaId: grupo.materiaId,
      materiaClave: materia?.clave ?? '',
      materiaNombre: materia?.nombre ?? '',
      creditos: materia?.creditos ?? 0,
      maestroNombre: maestro?.nombre ?? 'Sin asignar',
      periodoClave,
      cupoMaximo: grupo.cupoMaximo,
      disponibles: grupo.cupoMaximo - ocupados,
      horario: grupo.horario,
    };
  }
}
