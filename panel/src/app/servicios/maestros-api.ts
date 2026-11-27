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

  obtener(id: number) {
    return this.http.get<Sobre<Maestro>>(`${API_URL}/maestros/${id}`).pipe(map((r) => r.data));
  }

  gruposAsignados(id: number) {
    return this.http.get<Sobre<GrupoDelMaestro[]>>(`${API_URL}/maestros/${id}/grupos`).pipe(map((r) => r.data));
  }

  crear(datos: DatosNuevoMaestro) {
    return this.http.post<Sobre<Maestro>>(`${API_URL}/maestros`, datos).pipe(map((r) => r.data));
  }

  actualizar(id: number, nombre: string) {
    return this.http.patch<Sobre<Maestro>>(`${API_URL}/maestros/${id}`, { nombre }).pipe(map((r) => r.data));
  }

  eliminar(id: number) {
    return this.http.delete<Sobre<Maestro>>(`${API_URL}/maestros/${id}`).pipe(map((r) => r.data));
  }
}
