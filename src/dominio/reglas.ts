import { CALIFICACION_APROBATORIA, DIAS_DE_LA_SEMANA } from './entidades.js';
import type { BloqueHorario, Inscripcion, Pago, PeriodoEscolar, Rol, Sesion } from './entidades.js';
import { OperacionNoAutorizadaError } from './errores.js';

// Funciones puras que comparten los servicios.

// RN-08
export function exigirRol(sesion: Sesion, rol: Rol): void {
  if (sesion.rol !== rol) throw new OperacionNoAutorizadaError();
}

export function bloquesSeEmpalman(a: BloqueHorario, b: BloqueHorario): boolean {
  if (a.diaSemana !== b.diaSemana) return false;
  return a.minutoInicio < b.minutoFin && b.minutoInicio < a.minutoFin;
}

export function horariosSeEmpalman(a: BloqueHorario[], b: BloqueHorario[]): boolean {
  return a.some((bloque) => b.some((otroBloque) => bloquesSeEmpalman(bloque, otroBloque)));
}

// Ordena primero por dia de la semana y despues por hora de inicio.
export function compararPorDiaYHora(a: BloqueHorario, b: BloqueHorario): number {
  const diferenciaDeDia = DIAS_DE_LA_SEMANA.indexOf(a.diaSemana) - DIAS_DE_LA_SEMANA.indexOf(b.diaSemana);
  return diferenciaDeDia !== 0 ? diferenciaDeDia : a.minutoInicio - b.minutoInicio;
}

export function calificacionAprobatoria(calificacion: number): boolean {
  return calificacion >= CALIFICACION_APROBATORIA;
}

export function estaAprobada(inscripcion: Inscripcion): boolean {
  return (
    inscripcion.estadoActual === 'activa' &&
    inscripcion.calificacion !== null &&
    calificacionAprobatoria(inscripcion.calificacion)
  );
}

export function cargaEstaAbierta(periodo: PeriodoEscolar, ahora: Date = new Date()): boolean {
  return periodo.habilitado && ahora >= periodo.fechaAperturaCarga && ahora <= periodo.fechaCierreCarga;
}

export function pagoEstaVencido(pago: Pago, ahora: Date = new Date()): boolean {
  return pago.estado === 'pendiente' && pago.fechaLimite < ahora;
}
