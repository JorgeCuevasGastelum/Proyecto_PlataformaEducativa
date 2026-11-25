import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { API_URL } from '../config';
import type { Carrera, Materia, PlanDeEstudios, Sobre } from '../modelos/tipos';
import { mensajeDeApi } from './errores';

// Materias, carreras y planes se piden juntos: la pantalla de planes necesita las tres
// y el detalle de una materia necesita los nombres de las demás para sus prerrequisitos.
@Service()
export class ListaMaterias {
  private readonly materiasRes = httpResource<Sobre<Materia[]>>(() => `${API_URL}/materias`);
  private readonly carrerasRes = httpResource<Sobre<Carrera[]>>(() => `${API_URL}/carreras`);
  private readonly planesRes = httpResource<Sobre<PlanDeEstudios[]>>(() => `${API_URL}/planes`);

  readonly materias = computed(() => this.materiasRes.value()?.data ?? []);
  readonly carreras = computed(() => this.carrerasRes.value()?.data ?? []);
  readonly planes = computed(() => this.planesRes.value()?.data ?? []);

  readonly cargando = computed(
    () => this.materiasRes.isLoading() || this.carrerasRes.isLoading() || this.planesRes.isLoading(),
  );
  readonly error = computed(() => {
    const e = this.materiasRes.error() ?? this.carrerasRes.error() ?? this.planesRes.error();
    return e ? mensajeDeApi(e) : null;
  });

  // Se busca por clave o por nombre, que es como el personal identifica una materia.
  readonly texto = signal('');

  readonly visibles = computed(() => {
    const t = this.texto().trim().toLowerCase();
    const lista = [...this.materias()].sort((a, b) => a.clave.localeCompare(b.clave));
    if (!t) return lista;
    return lista.filter((m) => m.clave.toLowerCase().includes(t) || m.nombre.toLowerCase().includes(t));
  });

  materia(id: number): Materia | undefined {
    return this.materias().find((m) => m.id === id);
  }

  carrera(id: number): Carrera | undefined {
    return this.carreras().find((c) => c.id === id);
  }

  recargar(): void {
    this.materiasRes.reload();
    this.carrerasRes.reload();
    this.planesRes.reload();
  }
}
