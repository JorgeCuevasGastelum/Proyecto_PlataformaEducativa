import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { API_URL } from '../config';
import type { GrupoDeCatalogo, Maestro, PeriodoEscolar, Sobre } from '../modelos/tipos';
import { mensajeDeApi } from './errores';

@Service()
export class ListaGrupos {
  private readonly periodos = httpResource<Sobre<PeriodoEscolar[]>>(() => `${API_URL}/periodos`);
  readonly listaPeriodos = computed(() => this.periodos.value()?.data ?? []);

  private readonly maestros = httpResource<Sobre<Maestro[]>>(() => `${API_URL}/maestros`);
  readonly listaMaestros = computed(() => this.maestros.value()?.data ?? []);

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

  // httpResource vuelve a pedir los grupos solo cuando cambia el período.
  private readonly grupos = httpResource<Sobre<GrupoDeCatalogo[]>>(() => {
    const id = this.periodoElegido();
    return id ? `${API_URL}/grupos?periodoId=${id}` : undefined;
  });

  readonly cargando = computed(() => this.periodos.isLoading() || this.grupos.isLoading());
  readonly error = computed(() => {
    const e = this.periodos.error() ?? this.grupos.error();
    return e ? mensajeDeApi(e) : null;
  });

  readonly texto = signal('');

  // Se busca por materia, que es como el personal identifica un grupo.
  readonly visibles = computed(() => {
    const lista = this.grupos.value()?.data ?? [];
    const t = this.texto().trim().toLowerCase();
    if (!t) return lista;
    return lista.filter((g) => g.materiaNombre.toLowerCase().includes(t) || g.materiaClave.toLowerCase().includes(t));
  });

  recargar(): void {
    this.periodos.reload();
    this.grupos.reload();
  }
}
