import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { API_URL } from '../config';
import type { ConceptoDePago, Pago, Sobre } from '../modelos/tipos';

export interface CargoNuevo {
  alumnoId: number;
  periodoId: number;
  concepto: ConceptoDePago;
  monto: number;
  fechaLimite: string;
}

@Service()
export class PagosApi {
  private readonly http = inject(HttpClient);

  registrarCargo(datos: CargoNuevo) {
    return this.http.post<Sobre<Pago>>(`${API_URL}/pagos`, datos).pipe(map((r) => r.data));
  }

  marcarPagado(id: number) {
    return this.http
      .patch<Sobre<Pago>>(`${API_URL}/pagos/${id}`, { estado: 'pagado' })
      .pipe(map((r) => r.data));
  }
}
