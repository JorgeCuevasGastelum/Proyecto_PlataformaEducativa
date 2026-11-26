import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { API_URL } from '../config';
import type { Alumno, PlanDeEstudios, Sobre } from '../modelos/tipos';
import { mensajeDeApi } from './errores';

@Service()
export class ListaAlumnos {
  private readonly recurso = httpResource<Sobre<Alumno[]>>(() => `${API_URL}/alumnos`);
  private readonly recursoPlanes = httpResource<Sobre<PlanDeEstudios[]>>(() => `${API_URL}/planes`);

  private readonly alumnos = computed(() => this.recurso.hasValue() ? this.recurso.value().data : []);
  readonly planes = computed(() => this.recursoPlanes.hasValue() ? this.recursoPlanes.value().data : []);
  readonly cargandoPlanes = this.recursoPlanes.isLoading;
  readonly errorPlanes = computed(() => {
    const error = this.recursoPlanes.error();
    return error ? mensajeDeApi(error) : null;
  });

  readonly cargando = computed(() => this.recurso.isLoading() || this.cargandoPlanes());
  readonly error = computed(() => {
    const error = this.recurso.error();
    return error ? mensajeDeApi(error) : this.errorPlanes();
  });

  readonly texto = signal('');
  readonly planId = signal<number | null>(null);
  readonly visibles = computed(() => {
    const texto = this.texto().trim().toLowerCase();
    const planId = this.planId();
    return this.alumnos().filter((alumno) =>
      (planId === null || alumno.planDeEstudiosId === planId) &&
      (alumno.matricula.toLowerCase().includes(texto) || alumno.nombre.toLowerCase().includes(texto)),
    );
  });

  claveDelPlan(id: number): string {
    return this.planes().find((plan) => plan.id === id)?.clave ?? `Plan ${id}`;
  }

  recargar(): void {
    this.recurso.reload();
  }

  recargarPlanes(): void {
    this.recursoPlanes.reload();
  }
}
