import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ListaMaestros } from '../../servicios/lista-maestros';

@Component({
  selector: 'app-pagina-maestros',
  imports: [RouterLink],
  templateUrl: './pagina-maestros.html',
})
export class PaginaMaestros {
  protected readonly lista = inject(ListaMaestros);

  protected buscar(evento: Event): void {
    this.lista.texto.set((evento.target as HTMLInputElement).value);
  }
}
