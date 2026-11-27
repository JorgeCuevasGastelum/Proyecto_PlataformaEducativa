import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { API_URL } from '../config';
import type { Alumno, Pago, PeriodoEscolar, Sobre } from '../modelos/tipos';
import { mensajeDeApi } from './errores';
import { estaVencido, sinAcentos } from './formato';

export type FiltroDePago = 'todos' | 'pendientes' | 'vencidos' | 'pagados';

// Un pago con el nombre del alumno y la clave del período, para mostrarlo en la tabla.
export interface RenglonDePago {
  pago: Pago;
  alumno: string;
  matricula: string;
  periodo: string;
  vencido: boolean;
}

@Service()
export class ListaPagos {
  private readonly pagos = httpResource<Sobre<Pago[]>>(() => `${API_URL}/pagos`);
  private readonly alumnos = httpResource<Sobre<Alumno[]>>(() => `${API_URL}/alumnos`);
  private readonly periodos = httpResource<Sobre<PeriodoEscolar[]>>(() => `${API_URL}/periodos`);

  readonly listaAlumnos = computed(() => this.alumnos.value()?.data ?? []);
  readonly listaPeriodos = computed(() => this.periodos.value()?.data ?? []);

  readonly cargando = computed(
    () => this.pagos.isLoading() || this.alumnos.isLoading() || this.periodos.isLoading(),
  );
  readonly error = computed(() => {
    const e = this.pagos.error() ?? this.alumnos.error() ?? this.periodos.error();
    return e ? mensajeDeApi(e) : null;
  });

  // Lo que escribieron en el buscador y el filtro de estado
  readonly texto = signal('');
  readonly filtro = signal<FiltroDePago>('todos');

  private readonly renglones = computed(() => {
    const alumnos = this.listaAlumnos();
    const periodos = this.listaPeriodos();

    return (this.pagos.value()?.data ?? []).map((pago): RenglonDePago => {
      const alumno = alumnos.find((a) => a.id === pago.alumnoId);
      const periodo = periodos.find((p) => p.id === pago.periodoId);
      return {
        pago,
        alumno: alumno?.nombre ?? `Alumno ${pago.alumnoId}`,
        matricula: alumno?.matricula ?? '',
        periodo: periodo?.clave ?? '',
        vencido: estaVencido(pago),
      };
    });
  });

  readonly visibles = computed(() => {
    const t = sinAcentos(this.texto().trim());
    const filtro = this.filtro();

    return this.renglones().filter((r) => {
      if (t && !sinAcentos(r.alumno).includes(t) && !sinAcentos(r.matricula).includes(t)) {
        return false;
      }
      if (filtro === 'pendientes') return r.pago.estado === 'pendiente';
      if (filtro === 'vencidos') return r.vencido;
      if (filtro === 'pagados') return r.pago.estado === 'pagado';
      return true;
    });
  });

  // Cuánto se debe entre los pagos que se están viendo
  readonly totalPendiente = computed(() => {
    let total = 0;
    for (const r of this.visibles()) {
      if (r.pago.estado === 'pendiente') total = total + r.pago.monto;
    }
    return total;
  });

  recargar(): void {
    this.pagos.reload();
  }
}
