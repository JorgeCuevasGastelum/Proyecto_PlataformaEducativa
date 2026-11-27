import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Alumno } from '../../modelos/tipos';
import { AlumnosApi } from '../../servicios/alumnos-api';
import { mensajeDeApi } from '../../servicios/errores';
import { ListaAlumnos } from '../../servicios/lista-alumnos';
import { NoEncontrado } from '../no-encontrado';

@Component({
  selector: 'app-detalle-alumno',
  imports: [RouterLink, NoEncontrado],
  templateUrl: './detalle-alumno.html',
})
export class DetalleAlumno implements OnInit {
  private readonly api = inject(AlumnosApi);
  private readonly router = inject(Router);
  protected readonly lista = inject(ListaAlumnos);

  // Viene de la ruta /alumnos/:id
  readonly id = input<string>();

  protected readonly alumno = signal<Alumno | null>(null);
  protected readonly cargando = signal(true);
  protected readonly noExiste = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly errorBaja = signal<string | null>(null);
  protected readonly eliminando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.api.obtener(Number(this.id())).subscribe({
      next: (alumno) => {
        this.alumno.set(alumno);
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        // Un id que no es número también es "no existe" (el servicio responde 400).
        if (e.status === 404 || e.status === 400) this.noExiste.set(true);
        else this.errorCarga.set(mensajeDeApi(e));
        this.cargando.set(false);
      },
    });
  }

  protected eliminar(): void {
    const alumno = this.alumno();
    if (!alumno) return;
    if (!confirm(`¿Seguro que quieres eliminar a ${alumno.nombre} y su cuenta? Esto no se puede deshacer.`)) return;

    this.eliminando.set(true);
    this.errorBaja.set(null);
    this.api.eliminar(alumno.id).subscribe({
      next: () => {
        this.lista.recargar();
        this.router.navigate(['/alumnos']);
      },
      error: (e) => {
        this.errorBaja.set(mensajeDeApi(e));
        this.eliminando.set(false);
      },
    });
  }
}
