import { pedir } from '../compartido/servicios/api';
import type { Aviso } from '../compartido/tipos';

export function traerAvisos(periodoId: number) {
  return pedir<Aviso[]>('get', `/avisos?periodoId=${periodoId}`);
}