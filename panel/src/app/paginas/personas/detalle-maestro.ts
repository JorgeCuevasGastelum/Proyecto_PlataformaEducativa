import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { GrupoDelMaestro, Maestro } from '../../modelos/tipos';
import { mensajeDeApi } from '../../servicios/errores';
import { ListaMaestros } from '../../servicios/lista-maestros';
import { MaestrosApi } from '../../servicios/maestros-api';
import { NoEncontrado } from '../no-encontrado';

@Component({
  selector: 'app-detalle-maestro',
  imports: [RouterLink, NoEncontrado],
  templateUrl: './detalle-maestro.html',
})
export class DetalleMaestro implements OnInit {
  private readonly api = inject(MaestrosApi);
  private readonly lista = inject(ListaMaestros);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();
  protected readonly maestro = signal<Maestro | null>(null);
  protected readonly grupos = signal<GrupoDelMaestro[]>([]);
  protected readonly cargando = signal(true);
  protected readonly cargandoGrupos = signal(false);
  protected readonly noExiste = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly errorGrupos = signal<string | null>(null);
  protected readonly errorBaja = signal<string | null>(null);
  protected readonly eliminando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.api.obtener(this.id()).subscribe({
      next: (maestro) => {
        this.maestro.set(maestro);
        this.cargando.set(false);
        this.cargarGrupos();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404 || error.status === 400) this.noExiste.set(true);
        else this.errorCarga.set(mensajeDeApi(error));
        this.cargando.set(false);
      },
    });
  }

  protected cargarGrupos(): void {
    const maestro = this.maestro();
    if (!maestro) return;
    this.cargandoGrupos.set(true);
    this.errorGrupos.set(null);
    this.api.gruposAsignados(maestro.id).subscribe({
      next: (grupos) => {
        this.grupos.set(grupos);
        this.cargandoGrupos.set(false);
      },
      error: (error) => {
        this.errorGrupos.set(mensajeDeApi(error));
        this.cargandoGrupos.set(false);
      },
    });
  }

  protected eliminar(): void {
    const maestro = this.maestro();
    if (!maestro || this.eliminando()) return;
    if (!confirm(`¿Seguro que quieres eliminar a ${maestro.nombre} y su cuenta?`)) return;

    this.eliminando.set(true);
    this.errorBaja.set(null);
    this.api.eliminar(maestro.id).subscribe({
      next: () => {
        this.lista.recargar();
        if (!this.destroyRef.destroyed) this.router.navigate(['/maestros']);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) this.noExiste.set(true);
        else this.errorBaja.set(mensajeDeApi(error));
        this.eliminando.set(false);
      },
    });
  }
}
