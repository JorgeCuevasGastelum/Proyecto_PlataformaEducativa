import { httpResource } from '@angular/common/http';
import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_URL } from '../../config';
import type { OcupacionDeGrupo, ResumenDelPanel, Sobre } from '../../modelos/tipos';
import { mensajeDeApi } from '../../servicios/errores';

@Component({
  selector: 'app-tablero',
  imports: [RouterLink],
  templateUrl: './tablero.html',
})
export class Tablero {
  private readonly recurso = httpResource<Sobre<ResumenDelPanel>>(() => `${API_URL}/resumen`);

  protected readonly resumen = computed(() => this.recurso.value()?.data ?? null);
  protected readonly cargando = computed(() => this.recurso.isLoading());
  protected readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeApi(e) : null;
  });

  // De más lleno a menos lleno, para ver primero los que ya no tienen lugar.
  protected readonly grupos = computed(() => {
    const lista = [...(this.resumen()?.grupos ?? [])];
    return lista.sort((a, b) => this.porcentaje(b) - this.porcentaje(a));
  });

  protected readonly gruposLlenos = computed(
    () => this.grupos().filter((g) => g.inscritos >= g.cupoMaximo).length,
  );

  protected porcentaje(grupo: OcupacionDeGrupo): number {
    if (grupo.cupoMaximo === 0) return 100;
    return Math.min(100, Math.round((grupo.inscritos * 100) / grupo.cupoMaximo));
  }

  protected recargar(): void {
    this.recurso.reload();
  }
}
