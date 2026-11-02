import { pedir } from '../compartido/servicios/api';
import type { GrupoDeCatalogo, Inscripcion } from '../compartido/tipos';

export function traerGrupos() {
  return pedir<GrupoDeCatalogo[]>('get', '/grupos');
}

export function inscribirse(grupoId: number) {
  return pedir<Inscripcion>('post', '/inscripciones', { grupoId });
}