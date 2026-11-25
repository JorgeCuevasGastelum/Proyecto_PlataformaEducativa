import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { API_URL } from '../config';
import type { Carrera, PlanDeEstudios, Sobre } from '../modelos/tipos';

// El catálogo no pide editar ni borrar carreras o planes: solo darlos de alta y armar sus materias.
@Service()
export class PlanesApi {
  private readonly http = inject(HttpClient);

  crearCarrera(datos: { clave: string; nombre: string }) {
    return this.http.post<Sobre<Carrera>>(`${API_URL}/carreras`, datos).pipe(map((r) => r.data));
  }

  crearPlan(datos: { clave: string; carreraId: number }) {
    return this.http.post<Sobre<PlanDeEstudios>>(`${API_URL}/planes`, datos).pipe(map((r) => r.data));
  }

  agregarMateria(planId: number, materiaId: number) {
    return this.http
      .put<Sobre<PlanDeEstudios>>(`${API_URL}/planes/${planId}/materias/${materiaId}`, {})
      .pipe(map((r) => r.data));
  }

  quitarMateria(planId: number, materiaId: number) {
    return this.http
      .delete<Sobre<PlanDeEstudios>>(`${API_URL}/planes/${planId}/materias/${materiaId}`)
      .pipe(map((r) => r.data));
  }
}
