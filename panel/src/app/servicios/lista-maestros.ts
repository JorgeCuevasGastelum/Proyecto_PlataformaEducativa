import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { API_URL } from '../config';
import type { Maestro, Sobre } from '../modelos/tipos';
import { mensajeDeApi } from './errores';

@Service()
export class ListaMaestros {
  private readonly recurso = httpResource<Sobre<Maestro[]>>(() => `${API_URL}/maestros`);

  private readonly maestros = computed(() => this.recurso.value()?.data ?? []);
  readonly cargando = computed(() => this.recurso.isLoading());
  readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeApi(e) : null;
  });

  readonly texto = signal('');

  // Se busca por número de empleado o nombre.
  readonly visibles = computed(() => {
    const t = this.texto().trim().toLowerCase();
    return this.maestros().filter(
      (m) => m.numeroEmpleado.toLowerCase().includes(t) || m.nombre.toLowerCase().includes(t),
    );
  });

  recargar(): void {
    this.recurso.reload();
  }
}
