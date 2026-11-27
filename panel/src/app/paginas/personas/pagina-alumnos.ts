import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ListaAlumnos } from '../../servicios/lista-alumnos';

@Component({
  selector: 'app-pagina-alumnos',
  imports: [RouterLink],
  templateUrl: './pagina-alumnos.html',
})
export class PaginaAlumnos {
  protected readonly lista = inject(ListaAlumnos);

  protected buscar(evento: Event): void {
    this.lista.texto.set((evento.target as HTMLInputElement).value);
  }

  protected cambiarPlan(evento: Event): void {
    this.lista.planId.set(Number((evento.target as HTMLSelectElement).value));
  }

  protected recargar(): void {
    this.lista.recargar();
    this.lista.recargarPlanes();
  }
}
