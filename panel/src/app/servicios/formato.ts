import type { Pago } from '../modelos/tipos';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "2026-08-10T00:00:00.000Z" → "10 ago 2026"
export function fecha(texto: string): string {
  const [anio, mes, dia] = texto.slice(0, 10).split('-');
  return `${Number(dia)} ${MESES[Number(mes) - 1]} ${anio}`;
}

export function dinero(monto: number): string {
  return '$' + monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Para buscar: "Lucía" → "lucia", así encuentra el nombre aunque lo escriban sin acento.
// normalize('NFD') separa la letra de su acento y el replace quita los acentos.
export function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function estaVencido(pago: Pago): boolean {
  return pago.estado === 'pendiente' && new Date(pago.fechaLimite) < new Date();
}
