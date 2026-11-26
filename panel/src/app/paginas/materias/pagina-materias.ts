import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ListaMaterias } from '../../servicios/lista-materias';

@Component({
  selector: 'app-pagina-materias',
  imports: [RouterLink],
  templateUrl: './pagina-materias.html',
})
export class PaginaMaterias {
  protected readonly lista = inject(ListaMaterias);

  protected escribir(evento: Event): void {
    this.lista.texto.set((evento.target as HTMLInputElement).value);
  }
}
