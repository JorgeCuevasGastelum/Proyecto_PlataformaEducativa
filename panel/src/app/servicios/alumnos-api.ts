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

export interface CambiosDeAlumno {
  nombre: string;
  planDeEstudiosId: number;
}

@Service()
export class AlumnosApi {
  private readonly http = inject(HttpClient);

  obtener(id: number) {
    return this.http.get<Sobre<Alumno>>(`${API_URL}/alumnos/${id}`).pipe(map((r) => r.data));
  }

  crear(datos: DatosNuevoAlumno) {
    return this.http.post<Sobre<Alumno>>(`${API_URL}/alumnos`, datos).pipe(map((r) => r.data));
  }

  actualizar(id: number, cambios: CambiosDeAlumno) {
    return this.http.patch<Sobre<Alumno>>(`${API_URL}/alumnos/${id}`, cambios).pipe(map((r) => r.data));
  }

  eliminar(id: number) {
    return this.http.delete<Sobre<Alumno>>(`${API_URL}/alumnos/${id}`).pipe(map((r) => r.data));
  }
}
