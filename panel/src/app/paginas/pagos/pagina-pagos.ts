import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PagosApi } from '../../servicios/pagos-api';
import { FiltroDePago, ListaPagos, RenglonDePago } from '../../servicios/lista-pagos';
import { mensajeDeApi } from '../../servicios/errores';
import { dinero, fecha } from '../../servicios/formato';

interface Aviso {
  tipo: 'exito' | 'error';
  texto: string;
}

@Component({
  selector: 'app-pagina-pagos',
  imports: [RouterLink],
  templateUrl: './pagina-pagos.html',
})
export class PaginaPagos implements OnInit {
  protected readonly lista = inject(ListaPagos);
  private readonly api = inject(PagosApi);

  // Vienen en la dirección, por ejemplo /pagos?estado=vencidos o /pagos?buscar=00000123
  readonly estado = input<string>();
  readonly buscar = input<string>();

  protected readonly aviso = signal<Aviso | null>(null);
  protected readonly ocupado = signal<number | null>(null);

  protected readonly fecha = fecha;
  protected readonly dinero = dinero;

  ngOnInit(): void {
    const estado = this.estado();
    if (estado === 'pendientes' || estado === 'vencidos' || estado === 'pagados') {
      this.lista.filtro.set(estado);
    }
    const buscar = this.buscar();
    if (buscar) this.lista.texto.set(buscar);
  }

  protected escribir(evento: Event): void {
    this.lista.texto.set((evento.target as HTMLInputElement).value);
  }

  protected cambiarFiltro(evento: Event): void {
    this.lista.filtro.set((evento.target as HTMLSelectElement).value as FiltroDePago);
  }

  protected marcarPagado(r: RenglonDePago): void {
    const pregunta = `¿Marcar como pagado el cargo de ${r.pago.concepto} de ${r.alumno} por ${dinero(r.pago.monto)}?`;
    if (!confirm(pregunta)) return;

    this.ocupado.set(r.pago.id);
    this.aviso.set(null);

    this.api.marcarPagado(r.pago.id).subscribe({
      next: () => {
        this.aviso.set({ tipo: 'exito', texto: `Se registró el pago de ${r.alumno}.` });
        this.ocupado.set(null);
        this.lista.recargar();
      },
      error: (e) => {
        this.aviso.set({ tipo: 'error', texto: mensajeDeApi(e) });
        this.ocupado.set(null);
      },
    });
  }
}
