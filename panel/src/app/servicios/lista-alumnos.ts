import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { API_URL } from '../config';
import type { Alumno, PlanDeEstudios, Sobre } from '../modelos/tipos';
import { mensajeDeApi } from './errores';

@Service()
export class ListaAlumnos {
  private readonly recurso = httpResource<Sobre<Alumno[]>>(() => `${API_URL}/alumnos`);
  private readonly recursoPlanes = httpResource<Sobre<PlanDeEstudios[]>>(() => `${API_URL}/planes`);

  private readonly alumnos = computed(() => this.recurso.value()?.data ?? []);
  readonly planes = computed(() => this.recursoPlanes.value()?.data ?? []);
  readonly cargandoPlanes = computed(() => this.recursoPlanes.isLoading());
  readonly errorPlanes = computed(() => {
    const e = this.recursoPlanes.error();
    return e ? mensajeDeApi(e) : null;
  });

  readonly cargando = computed(() => this.recurso.isLoading() || this.recursoPlanes.isLoading());
  readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeApi(e) : this.errorPlanes();
  });

  readonly texto = signal('');
  readonly planId = signal(0);

  // Se busca por matrícula o nombre, y se puede filtrar por plan.
  readonly visibles = computed(() => {
    const t = this.texto().trim().toLowerCase();
    const plan = this.planId();
    return this.alumnos().filter(
      (a) =>
        (!plan || a.planDeEstudiosId === plan) &&
        (a.matricula.toLowerCase().includes(t) || a.nombre.toLowerCase().includes(t)),
    );
  });

  claveDelPlan(id: number): string {
    return this.planes().find((p) => p.id === id)?.clave ?? `Plan ${id}`;
  }

  recargar(): void {
    this.recurso.reload();
  }

  recargarPlanes(): void {
    this.recursoPlanes.reload();
  }
}
