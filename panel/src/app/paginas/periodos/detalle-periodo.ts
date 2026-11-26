import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { GrupoDeCatalogo, PeriodoEscolar } from '../../modelos/tipos';
import { NoEncontrado } from '../no-encontrado';
import { PeriodosApi } from '../../servicios/periodos-api';
import { GruposApi } from '../../servicios/grupos-api';
import { ListaPeriodos } from '../../servicios/lista-periodos';
import { mensajeDeApi } from '../../servicios/errores';
import { fecha } from '../../servicios/formato';
import { textoDeHorario } from '../../servicios/horario';

interface Mensaje {
  tipo: 'exito' | 'error';
  texto: string;
}

@Component({
  selector: 'app-detalle-periodo',
  imports: [RouterLink, NoEncontrado],
  templateUrl: './detalle-periodo.html',
})
export class DetallePeriodo implements OnInit {
  private readonly lista = inject(ListaPeriodos);
  private readonly api = inject(PeriodosApi);
  private readonly gruposApi = inject(GruposApi);
  private readonly router = inject(Router);

  // Viene de la ruta /periodos/:id
  readonly id = input<string>();

  protected readonly periodo = signal<PeriodoEscolar | null>(null);
  protected readonly grupos = signal<GrupoDeCatalogo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly noExiste = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly mensaje = signal<Mensaje | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly fecha = fecha;
  protected readonly textoDeHorario = textoDeHorario;

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.api.obtener(Number(this.id())).subscribe({
      next: (periodo) => {
        this.periodo.set(periodo);
        this.cargarGrupos(periodo.id);
      },
      error: (e: HttpErrorResponse) => {
        // Un id que no es número también es "no existe" (el servicio responde 400).
        if (e.status === 404 || e.status === 400) this.noExiste.set(true);
        else this.errorCarga.set(mensajeDeApi(e));
        this.cargando.set(false);
      },
    });
  }

  private cargarGrupos(periodoId: number): void {
    this.gruposApi.listarDePeriodo(periodoId).subscribe({
      next: (grupos) => {
        this.grupos.set(grupos);
        this.cargando.set(false);
      },
      error: (e) => {
        this.errorCarga.set(mensajeDeApi(e));
        this.cargando.set(false);
      },
    });
  }

  protected inscritos(grupo: GrupoDeCatalogo): number {
    return grupo.cupoMaximo - grupo.disponibles;
  }

  protected eliminar(): void {
    const p = this.periodo();
    if (!p) return;
    if (!confirm(`¿Seguro que quieres eliminar el período ${p.clave}? Esto no se puede deshacer.`)) return;

    this.ocupado.set(true);
    this.mensaje.set(null);
    this.api.eliminar(p.id).subscribe({
      next: () => {
        this.lista.recargar();
        this.router.navigate(['/periodos']);
      },
      error: (e) => {
        this.mensaje.set({ tipo: 'error', texto: mensajeDeApi(e) });
        this.ocupado.set(false);
      },
    });
  }
}
