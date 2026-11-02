import { pedir } from '../compartido/servicios/api';
import type { Historial } from '../compartido/tipos';

export function traerHistorial() {
  return pedir<Historial[]>('get', '/alumnos/yo/historial');
}