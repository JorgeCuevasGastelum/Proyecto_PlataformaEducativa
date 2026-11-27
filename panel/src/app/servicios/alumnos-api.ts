import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { API_URL } from '../config';
import type { Alumno, Sobre } from '../modelos/tipos';

export interface DatosNuevoAlumno {
  matricula: string;
  nombre: string;
  correoInstitucional: string;
  contrasena: string;
  planDeEstudiosId: number;
}

@Service()
export class AlumnosApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/alumnos`;

  obtener(id: string) {
    return this.http.get<Sobre<Alumno>>(`${this.url}/${encodeURIComponent(id)}`).pipe(map((r) => r.data));
  }

  crear(datos: DatosNuevoAlumno) {
    return this.http.post<Sobre<Alumno>>(this.url, datos).pipe(map((r) => r.data));
  }

  actualizar(id: string, cambios: Partial<Pick<Alumno, 'nombre' | 'planDeEstudiosId'>>) {
    return this.http.patch<Sobre<Alumno>>(`${this.url}/${encodeURIComponent(id)}`, cambios).pipe(map((r) => r.data));
  }

  eliminar(id: number) {
    return this.http.delete<Sobre<Alumno>>(`${this.url}/${id}`).pipe(map((r) => r.data));
  }
}
