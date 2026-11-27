import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { API_URL } from '../config';
import type { AlumnoEnLista, DiaSemana, Grupo, GrupoDeCatalogo, Sobre } from '../modelos/tipos';

export interface BloqueDeHorarioNuevo {
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

export interface DatosNuevoGrupo {
  materiaId: number;
  periodoId: number;
  clave: string;
  maestroId: number;
  cupoMaximo: number;
  horario: BloqueDeHorarioNuevo[];
}

export interface CambiosDeGrupo {
  cupoMaximo: number;
  maestroId?: number;
}

@Service()
export class GruposApi {
  private readonly http = inject(HttpClient);

  listarDePeriodo(periodoId: number) {
    return this.http
      .get<Sobre<GrupoDeCatalogo[]>>(`${API_URL}/grupos`, { params: { periodoId } })
      .pipe(map((r) => r.data));
  }

  obtener(id: number) {
    return this.http.get<Sobre<GrupoDeCatalogo>>(`${API_URL}/grupos/${id}`).pipe(map((r) => r.data));
  }

  alumnos(id: number) {
    return this.http.get<Sobre<AlumnoEnLista[]>>(`${API_URL}/grupos/${id}/alumnos`).pipe(map((r) => r.data));
  }

  abrir(datos: DatosNuevoGrupo) {
    return this.http.post<Sobre<Grupo>>(`${API_URL}/grupos`, datos).pipe(map((r) => r.data));
  }

  cambiar(id: number, cambios: CambiosDeGrupo) {
    return this.http.patch<Sobre<Grupo>>(`${API_URL}/grupos/${id}`, cambios).pipe(map((r) => r.data));
  }

  eliminar(id: number) {
    return this.http.delete<Sobre<Grupo>>(`${API_URL}/grupos/${id}`).pipe(map((r) => r.data));
  }
}
