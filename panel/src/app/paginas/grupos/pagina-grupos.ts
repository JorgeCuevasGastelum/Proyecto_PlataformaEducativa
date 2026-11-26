import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { GrupoDeCatalogo } from '../../modelos/tipos';
import { ListaGrupos } from '../../servicios/lista-grupos';
import { textoDeHorario } from '../../servicios/horario';

@Component({
  selector: 'app-pagina-grupos',
  imports: [RouterLink],
  templateUrl: './pagina-grupos.html',
})
export class PaginaGrupos {
  protected readonly lista = inject(ListaGrupos);
  protected readonly textoDeHorario = textoDeHorario;

  protected escribir(evento: Event): void {
    this.lista.texto.set((evento.target as HTMLInputElement).value);
  }

  protected elegirPeriodo(evento: Event): void {
    this.lista.periodoId.set(Number((evento.target as HTMLSelectElement).value));
  }

  protected inscritos(grupo: GrupoDeCatalogo): number {
    return grupo.cupoMaximo - grupo.disponibles;
  }
}
