import { pedir } from '../compartido/servicios/api';
import type { Inscripcion, MateriaInscrita } from '../compartido/tipos';

export function traerMateriasInscritas() {
  return pedir<MateriaInscrita[]>('get', '/alumnos/yo/materias');
}

export function darDeBaja(inscripcionId: number) {
  return pedir<Inscripcion>('delete', `/inscripciones/${inscripcionId}`);
}