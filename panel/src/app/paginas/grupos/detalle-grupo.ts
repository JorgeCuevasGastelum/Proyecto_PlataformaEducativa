import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { AlumnoEnLista, GrupoDeCatalogo } from '../../modelos/tipos';
import { NoEncontrado } from '../no-encontrado';
import { GruposApi } from '../../servicios/grupos-api';
import type { CambiosDeGrupo, CuposDeGrupo } from '../../servicios/grupos-api';
import { ListaGrupos } from '../../servicios/lista-grupos';
import { mensajeDeApi } from '../../servicios/errores';

interface Mensaje {
  tipo: 'exito' | 'error';
  texto: string;
}

@Component({
  selector: 'app-detalle-grupo',
  imports: [ReactiveFormsModule, RouterLink, NoEncontrado],
  templateUrl: './detalle-grupo.html',
})
export class DetalleGrupo implements OnInit {
  protected readonly lista = inject(ListaGrupos);
  private readonly api = inject(GruposApi);
  private readonly router = inject(Router);

  // Vienen de la ruta /grupos/:id?periodoId=2
  readonly id = input<string>();
  readonly periodoId = input<string>();

  protected readonly cupos = signal<CuposDeGrupo | null>(null);
  protected readonly grupo = signal<GrupoDeCatalogo | null>(null);
  protected readonly alumnos = signal<AlumnoEnLista[]>([]);
  protected readonly cargando = signal(true);
  protected readonly noExiste = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly mensaje = signal<Mensaje | null>(null);
  protected readonly ocupado = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    cupoMaximo: [0, [Validators.required, Validators.min(1), Validators.pattern('^[0-9]+$')]],
    maestroId: [''],
  });

  protected get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.traerDatos();
  }

  private traerDatos(): void {
    this.api.ocupacion(Number(this.id())).subscribe({
      next: (cupos) => {
        this.cupos.set(cupos);
        this.form.reset({ cupoMaximo: cupos.ocupados + cupos.disponibles, maestroId: '' });
        this.traerGrupo();
      },
      error: (e: HttpErrorResponse) => {
        // Un id que no es número también es "no existe" (el servicio responde 400).
        if (e.status === 404 || e.status === 400) this.noExiste.set(true);
        else this.errorCarga.set(mensajeDeApi(e));
        this.cargando.set(false);
      },
    });
  }

  // El servicio no tiene un GET de un solo grupo: sus datos se sacan de la lista del período.
  private traerGrupo(): void {
    const periodo = this.periodoId() ? Number(this.periodoId()) : this.lista.periodoElegido();
    if (!periodo) {
      this.traerAlumnos();
      return;
    }

    this.api.listarDePeriodo(periodo).subscribe({
      next: (grupos) => {
        this.grupo.set(grupos.find((g) => g.grupoId === Number(this.id())) ?? null);
        this.traerAlumnos();
      },
      error: () => this.traerAlumnos(),
    });
  }

  private traerAlumnos(): void {
    this.api.alumnos(Number(this.id())).subscribe({
      next: (alumnos) => {
        this.alumnos.set(alumnos);
        this.cargando.set(false);
      },
      error: (e) => {
        this.errorCarga.set(mensajeDeApi(e));
        this.cargando.set(false);
      },
    });
  }

  protected cupoTotal(cupos: CuposDeGrupo): number {
    return cupos.ocupados + cupos.disponibles;
  }

  protected porcentaje(cupos: CuposDeGrupo): number {
    const total = this.cupoTotal(cupos);
    if (total === 0) return 100;
    return Math.min(100, Math.round((cupos.ocupados * 100) / total));
  }

  protected cambiar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const datos = this.form.getRawValue();
    const cambios: CambiosDeGrupo = { cupoMaximo: Number(datos.cupoMaximo) };
    if (datos.maestroId) cambios.maestroId = Number(datos.maestroId);

    this.ocupado.set(true);
    this.mensaje.set(null);
    this.api.cambiar(Number(this.id()), cambios).subscribe({
      next: () => {
        this.mensaje.set({ tipo: 'exito', texto: 'Se guardaron los cambios del grupo.' });
        this.ocupado.set(false);
        this.lista.recargar();
        this.traerDatos();
      },
      error: (e) => {
        this.mensaje.set({ tipo: 'error', texto: mensajeDeApi(e) });
        this.ocupado.set(false);
      },
    });
  }

  protected eliminar(): void {
    const g = this.grupo();
    const nombre = g ? `${g.grupoClave} de ${g.materiaNombre}` : this.id();
    if (!confirm(`¿Seguro que quieres eliminar el grupo ${nombre}? Esto no se puede deshacer.`)) return;

    this.ocupado.set(true);
    this.mensaje.set(null);
    this.api.eliminar(Number(this.id())).subscribe({
      next: () => {
        this.lista.recargar();
        this.router.navigate(['/grupos']);
      },
      error: (e) => {
        this.mensaje.set({ tipo: 'error', texto: mensajeDeApi(e) });
        this.ocupado.set(false);
      },
    });
  }
}
