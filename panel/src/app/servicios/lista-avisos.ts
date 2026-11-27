import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { API_URL } from '../config';
import type { Aviso, PeriodoEscolar, Sobre } from '../modelos/tipos';
import { mensajeDeApi } from './errores';
import { sinAcentos } from './formato';

@Service()
export class ListaAvisos {
  private readonly periodos = httpResource<Sobre<PeriodoEscolar[]>>(() => `${API_URL}/periodos`);
  readonly listaPeriodos = computed(() => this.periodos.value()?.data ?? []);

  // El período que eligieron en el select. Mientras no elijan, se usa el de carga abierta
  // (o el último si no hay ninguno abierto).
  readonly periodoId = signal<number | null>(null);
  readonly periodoElegido = computed(() => {
    const elegido = this.periodoId();
    if (elegido) return elegido;
    const periodos = this.listaPeriodos();
    const abierto = periodos.find((p) => p.habilitado);
    if (abierto) return abierto.id;
    return periodos.length ? periodos[periodos.length - 1].id : null;
  });

  // httpResource vuelve a pedir los avisos solo cuando cambia el período.
  private readonly avisos = httpResource<Sobre<Aviso[]>>(() => {
    const id = this.periodoElegido();
    return id ? `${API_URL}/avisos?periodoId=${id}` : undefined;
  });

  readonly cargando = computed(() => this.periodos.isLoading() || this.avisos.isLoading());
  readonly error = computed(() => {
    const e = this.periodos.error() ?? this.avisos.error();
    return e ? mensajeDeApi(e) : null;
  });

  readonly texto = signal('');

  readonly visibles = computed(() => {
    const lista = this.avisos.value()?.data ?? [];
    const t = sinAcentos(this.texto().trim());
    if (!t) return lista;
    return lista.filter((a) => sinAcentos(a.titulo).includes(t) || sinAcentos(a.contenido).includes(t));
  });

  recargar(): void {
    this.periodos.reload();
    this.avisos.reload();
  }
}
