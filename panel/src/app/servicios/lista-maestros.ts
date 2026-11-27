import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { API_URL } from '../config';
import type { Maestro, Sobre } from '../modelos/tipos';
import { mensajeDeApi } from './errores';

@Service()
export class ListaMaestros {
  private readonly recurso = httpResource<Sobre<Maestro[]>>(() => `${API_URL}/maestros`);
  private readonly maestros = computed(() => this.recurso.hasValue() ? this.recurso.value().data : []);
  readonly cargando = this.recurso.isLoading;
  readonly error = computed(() => {
    const error = this.recurso.error();
    return error ? mensajeDeApi(error) : null;
  });

  readonly texto = signal('');
  readonly visibles = computed(() => {
    const texto = this.texto().trim().toLowerCase();
    return this.maestros().filter((maestro) =>
      maestro.numeroEmpleado.toLowerCase().includes(texto) || maestro.nombre.toLowerCase().includes(texto),
    );
  });

  recargar(): void {
    this.recurso.reload();
  }
}
