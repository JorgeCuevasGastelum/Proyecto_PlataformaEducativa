import type { AlumnoEnLista } from './entidades.js';
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
