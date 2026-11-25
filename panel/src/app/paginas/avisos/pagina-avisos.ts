import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Aviso } from '../../modelos/tipos';
import { AvisosApi } from '../../servicios/avisos-api';
import { ListaAvisos } from '../../servicios/lista-avisos';
import { mensajeDeApi } from '../../servicios/errores';
import { fecha } from '../../servicios/formato';

interface Mensaje {
  tipo: 'exito' | 'error';
  texto: string;
}

@Component({
  selector: 'app-pagina-avisos',
  imports: [RouterLink],
  templateUrl: './pagina-avisos.html',
})
export class PaginaAvisos {
  protected readonly lista = inject(ListaAvisos);
  private readonly api = inject(AvisosApi);

  protected readonly mensaje = signal<Mensaje | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly fecha = fecha;

  protected escribir(evento: Event): void {
    this.lista.texto.set((evento.target as HTMLInputElement).value);
  }

  protected elegirPeriodo(evento: Event): void {
    this.lista.periodoId.set(Number((evento.target as HTMLSelectElement).value));
  }

  protected eliminar(aviso: Aviso): void {
    if (!confirm(`¿Seguro que quieres borrar el aviso "${aviso.titulo}"? Los alumnos ya no lo verán.`)) return;

    this.ocupado.set(true);
    this.mensaje.set(null);

    this.api.eliminar(aviso.id).subscribe({
      next: () => {
        this.mensaje.set({ tipo: 'exito', texto: `Se borró el aviso "${aviso.titulo}".` });
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
