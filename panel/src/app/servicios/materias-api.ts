import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { API_URL } from '../config';
import type { Materia, Sobre } from '../modelos/tipos';

export interface DatosNuevaMateria {
  clave: string;
  nombre: string;
  descripcion: string;
  creditos: number;
  prerrequisitoIds: number[];
}

export interface CambiosDeMateria {
  nombre: string;
  descripcion: string;
  creditos: number;
}

@Service()
export class MateriasApi {
  private readonly http = inject(HttpClient);

  obtener(id: number) {
    return this.http.get<Sobre<Materia>>(`${API_URL}/materias/${id}`).pipe(map((r) => r.data));
  }

  crear(datos: DatosNuevaMateria) {
    return this.http.post<Sobre<Materia>>(`${API_URL}/materias`, datos).pipe(map((r) => r.data));
  }

  actualizar(id: number, cambios: CambiosDeMateria) {
    return this.http.patch<Sobre<Materia>>(`${API_URL}/materias/${id}`, cambios).pipe(map((r) => r.data));
  }

  eliminar(id: number) {
    return this.http.delete<Sobre<Materia>>(`${API_URL}/materias/${id}`).pipe(map((r) => r.data));
  }

  agregarPrerrequisito(id: number, prerrequisitoId: number) {
    return this.http
      .put<Sobre<Materia>>(`${API_URL}/materias/${id}/prerrequisitos/${prerrequisitoId}`, {})
      .pipe(map((r) => r.data));
  }

  quitarPrerrequisito(id: number, prerrequisitoId: number) {
    return this.http
      .delete<Sobre<Materia>>(`${API_URL}/materias/${id}/prerrequisitos/${prerrequisitoId}`)
      .pipe(map((r) => r.data));
  }
}
