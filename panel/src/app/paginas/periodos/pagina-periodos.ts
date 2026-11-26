import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PeriodoEscolar } from '../../modelos/tipos';
import { PeriodosApi } from '../../servicios/periodos-api';
import { ListaPeriodos } from '../../servicios/lista-periodos';
import { mensajeDeApi } from '../../servicios/errores';
import { fecha } from '../../servicios/formato';

interface Mensaje {
  tipo: 'exito' | 'error';
  texto: string;
}

@Component({
  selector: 'app-pagina-periodos',
  imports: [RouterLink],
  templateUrl: './pagina-periodos.html',
})
export class PaginaPeriodos {
  protected readonly lista = inject(ListaPeriodos);
  private readonly api = inject(PeriodosApi);

  protected readonly mensaje = signal<Mensaje | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly fecha = fecha;

  protected cambiarCarga(periodo: PeriodoEscolar): void {
    const abrir = !periodo.habilitado;
    if (abrir) {
      if (!confirm(`¿Abrir la carga del período ${periodo.clave}? Los alumnos podrán inscribir materias.`)) return;
    } else {
      if (!confirm(`¿Cerrar la carga del período ${periodo.clave}? Los alumnos ya no podrán inscribir materias.`)) return;
    }

    this.ocupado.set(true);
    this.mensaje.set(null);

    this.api.cambiarCarga(periodo.id, abrir).subscribe({
      next: () => {
        const accion = abrir ? 'abrió' : 'cerró';
        this.mensaje.set({ tipo: 'exito', texto: `Se ${accion} la carga del período ${periodo.clave}.` });
        this.ocupado.set(false);
        this.lista.recargar();
      },
      error: (e) => {
        this.mensaje.set({ tipo: 'error', texto: mensajeDeApi(e) });
        this.ocupado.set(false);
      },
    });
  }
}
