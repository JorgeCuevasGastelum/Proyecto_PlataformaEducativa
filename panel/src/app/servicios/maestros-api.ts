import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { API_URL } from '../config';
import type { GrupoDelMaestro, Maestro, Sobre } from '../modelos/tipos';

export interface DatosNuevoMaestro {
  numeroEmpleado: string;
  nombre: string;
  correoInstitucional: string;
  contrasena: string;
}

@Service()
export class MaestrosApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/maestros`;

  obtener(id: string) {
    return this.http.get<Sobre<Maestro>>(`${this.url}/${encodeURIComponent(id)}`).pipe(map((r) => r.data));
  }

  gruposAsignados(id: number) {
    return this.http.get<Sobre<GrupoDelMaestro[]>>(`${this.url}/${id}/grupos`).pipe(map((r) => r.data));
  }

  crear(datos: DatosNuevoMaestro) {
    return this.http.post<Sobre<Maestro>>(this.url, datos).pipe(map((r) => r.data));
  }

  actualizar(id: string, cambios: Pick<Maestro, 'nombre'>) {
    return this.http.patch<Sobre<Maestro>>(`${this.url}/${encodeURIComponent(id)}`, cambios).pipe(map((r) => r.data));
  }

  eliminar(id: number) {
    return this.http.delete<Sobre<Maestro>>(`${this.url}/${id}`).pipe(map((r) => r.data));
  }
}
