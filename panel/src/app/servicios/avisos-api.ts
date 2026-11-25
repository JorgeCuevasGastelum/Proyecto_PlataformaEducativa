import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { API_URL } from '../config';
import type { Aviso, Sobre } from '../modelos/tipos';

@Service()
export class AvisosApi {
  private readonly http = inject(HttpClient);

  obtener(id: number) {
    return this.http.get<Sobre<Aviso>>(`${API_URL}/avisos/${id}`).pipe(map((r) => r.data));
  }

  publicar(datos: { periodoId: number; titulo: string; contenido: string }) {
    return this.http.post<Sobre<Aviso>>(`${API_URL}/avisos`, datos).pipe(map((r) => r.data));
  }

  editar(id: number, datos: { titulo: string; contenido: string }) {
    return this.http.patch<Sobre<Aviso>>(`${API_URL}/avisos/${id}`, datos).pipe(map((r) => r.data));
  }

  eliminar(id: number) {
    return this.http.delete<Sobre<Aviso>>(`${API_URL}/avisos/${id}`).pipe(map((r) => r.data));
  }
}
