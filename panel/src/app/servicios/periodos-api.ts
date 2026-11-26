import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { API_URL } from '../config';
import type { PeriodoEscolar, Sobre } from '../modelos/tipos';

export interface DatosDePeriodo {
  clave: string;
  fechaAperturaCarga: string;
  fechaCierreCarga: string;
  creditosMaximos: number;
}

@Service()
export class PeriodosApi {
  private readonly http = inject(HttpClient);

  obtener(id: number) {
    return this.http.get<Sobre<PeriodoEscolar>>(`${API_URL}/periodos/${id}`).pipe(map((r) => r.data));
  }

  crear(datos: DatosDePeriodo) {
    return this.http.post<Sobre<PeriodoEscolar>>(`${API_URL}/periodos`, datos).pipe(map((r) => r.data));
  }

  actualizar(id: number, datos: DatosDePeriodo) {
    return this.http.put<Sobre<PeriodoEscolar>>(`${API_URL}/periodos/${id}`, datos).pipe(map((r) => r.data));
  }

  cambiarCarga(id: number, cargaAbierta: boolean) {
    return this.http.patch<Sobre<PeriodoEscolar>>(`${API_URL}/periodos/${id}`, { cargaAbierta }).pipe(map((r) => r.data));
  }

  eliminar(id: number) {
    return this.http.delete<Sobre<PeriodoEscolar>>(`${API_URL}/periodos/${id}`).pipe(map((r) => r.data));
  }
}
