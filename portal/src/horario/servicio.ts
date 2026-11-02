import { pedir } from '../compartido/servicios/api';
import type { RenglonDeHorario } from '../compartido/tipos';

export function traerHorario() {
  return pedir<RenglonDeHorario[]>('get', '/alumnos/yo/horario');
}