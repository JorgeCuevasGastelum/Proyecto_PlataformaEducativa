import { pedir } from '../compartido/servicios/api';
import type { Pago } from '../compartido/tipos';

export function traerPagos() {
  return pedir<Pago[]>('get', '/alumnos/yo/pagos');
}

export function pagarCargo(pagoId: number) {
  return pedir<Pago>('patch', `/alumnos/yo/pagos/${pagoId}`, { estado: 'pagado' });
}