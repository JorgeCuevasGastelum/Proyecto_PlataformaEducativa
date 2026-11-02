import { pedir } from './api';
import type { PeriodoEscolar } from '../tipos';

export function traerPeriodos() {
  return pedir<PeriodoEscolar[]>('get', '/periodos');
}

export function periodoAbierto(periodos: PeriodoEscolar[]): PeriodoEscolar | undefined {
  return periodos.find((p) => p.habilitado);
}