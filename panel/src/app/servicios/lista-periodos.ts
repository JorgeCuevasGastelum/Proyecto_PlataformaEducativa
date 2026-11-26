import { httpResource } from '@angular/common/http';
import { computed, Service } from '@angular/core';
import { API_URL } from '../config';
import type { PeriodoEscolar, Sobre } from '../modelos/tipos';
import { mensajeDeApi } from './errores';

@Service()
export class ListaPeriodos {
  private readonly recurso = httpResource<Sobre<PeriodoEscolar[]>>(() => `${API_URL}/periodos`);

  readonly periodos = computed(() => this.recurso.value()?.data ?? []);
  readonly cargando = computed(() => this.recurso.isLoading());
  readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeApi(e) : null;
  });

  // Se llama después de crear, editar, borrar o cambiar la carga, para que la tabla se actualice sola.
  recargar(): void {
    this.recurso.reload();
  }
}
