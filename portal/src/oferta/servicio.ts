import { pedir } from '../compartido/servicios/api';
import type { GrupoDeCatalogo, Inscripcion, Materia, PlanDeEstudios } from '../compartido/tipos';

export function traerGrupos() {
  return pedir<GrupoDeCatalogo[]>('get', '/grupos');
}

export function traerMiPlan() {
  return pedir<PlanDeEstudios>('get', '/alumnos/yo/plan');
}

export function traerMaterias() {
  return pedir<Materia[]>('get', '/materias');
}

export function inscribirse(grupoId: number) {
  return pedir<Inscripcion>('post', '/inscripciones', { grupoId });
}