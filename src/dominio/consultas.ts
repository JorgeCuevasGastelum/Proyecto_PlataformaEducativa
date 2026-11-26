import type { AlumnoEnLista, GrupoDelMaestro } from './entidades.js';
import type { RepositorioAcademico } from './repositorio-academico.js';

export async function alumnosInscritosEnGrupo(repo: RepositorioAcademico, grupoId: number): Promise<AlumnoEnLista[]> {
  const lista: AlumnoEnLista[] = [];
  for (const inscripcion of await repo.listarInscripcionesDeGrupo(grupoId)) {
    if (inscripcion.estadoActual !== 'activa') continue;
    const alumno = await repo.buscarAlumnoPorId(inscripcion.alumnoId);
    if (!alumno) continue;
    lista.push({
      inscripcionId: inscripcion.id,
      matricula: alumno.matricula,
      nombre: alumno.nombre,
      calificacion: inscripcion.calificacion,
    });
  }
  return lista;
}

export async function gruposAsignadosAMaestro(repo: RepositorioAcademico, maestroId: number): Promise<GrupoDelMaestro[]> {
  const resultado: GrupoDelMaestro[] = [];
  for (const grupo of await repo.listarGruposDeMaestro(maestroId)) {
    const materia = await repo.buscarMateriaPorId(grupo.materiaId);
    const periodo = await repo.buscarPeriodoPorId(grupo.periodoId);
    resultado.push({
      grupoId: grupo.id,
      grupoClave: grupo.clave,
      materiaNombre: materia?.nombre ?? String(grupo.materiaId),
      periodoClave: periodo?.clave ?? String(grupo.periodoId),
      inscritos: await repo.contarInscripcionesActivasDeGrupo(grupo.id),
    });
  }
  return resultado;
}
