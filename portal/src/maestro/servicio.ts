import { pedir } from '../compartido/servicios/api';
import type { AlumnoEnLista, CapturaDeCalificacion, GrupoDelMaestro, Inscripcion } from '../compartido/tipos';

export function traerMisGrupos() {
  return pedir<GrupoDelMaestro[]>('get', '/maestros/yo/grupos');
}

export function traerAlumnos(grupoId: number) {
  return pedir<AlumnoEnLista[]>('get', `/grupos/${grupoId}/alumnos`);
}

export function capturarCalificaciones(grupoId: number, calificaciones: CapturaDeCalificacion[]) {
  return pedir<Inscripcion[]>('put', `/grupos/${grupoId}/calificaciones`, { calificaciones });
}