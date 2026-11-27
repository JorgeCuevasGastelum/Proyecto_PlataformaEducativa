import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LONGITUD_MINIMA_CONTRASENA } from '../../modelos/tipos';
import { mensajeDeApi } from '../../servicios/errores';
import { ListaMaestros } from '../../servicios/lista-maestros';
import { MaestrosApi } from '../../servicios/maestros-api';
import { NoEncontrado } from '../no-encontrado';

@Component({
  selector: 'app-formulario-maestro',
  imports: [ReactiveFormsModule, RouterLink, NoEncontrado],
  templateUrl: './formulario-maestro.html',
})
export class FormularioMaestro implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly api = inject(MaestrosApi);
  private readonly lista = inject(ListaMaestros);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input<string>();
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly noExiste = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly errorGuardado = signal<string | null>(null);
  protected readonly minimoContrasena = LONGITUD_MINIMA_CONTRASENA;

  protected readonly form = this.fb.group({
    numeroEmpleado: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(80)]],
    correoInstitucional: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    contrasena: ['', [Validators.required, Validators.minLength(LONGITUD_MINIMA_CONTRASENA)]],
  });
  protected readonly campos = this.form.controls;

  ngOnInit(): void {
    if (!this.id()) return;
    this.campos.numeroEmpleado.disable();
    this.campos.correoInstitucional.disable();
    this.campos.contrasena.disable();
    this.cargar();
  }

  tieneCambios(): boolean {
    return this.form.dirty;
  }

  protected cargar(): void {
    const id = this.id();
    if (!id) return;
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.api.obtener(id).subscribe({
      next: (maestro) => {
        this.form.patchValue({ nombre: maestro.nombre });
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404 || error.status === 400) this.noExiste.set(true);
        else this.errorCarga.set(mensajeDeApi(error));
        this.cargando.set(false);
      },
    });
  }

  protected guardar(): void {
    if (this.guardando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGuardado.set(null);
    const id = this.id();
    const { numeroEmpleado, nombre, correoInstitucional, contrasena } = this.form.getRawValue();
    const cambios = { nombre: nombre.trim() };
    const peticion = id
      ? this.api.actualizar(id, cambios)
      : this.api.crear({ numeroEmpleado: numeroEmpleado.trim(), correoInstitucional, contrasena, ...cambios });

    peticion.subscribe({
      next: (maestro) => {
        this.form.markAsPristine();
        this.guardando.set(false);
        this.lista.recargar();
        if (!this.destroyRef.destroyed) this.router.navigate(['/maestros', maestro.id]);
      },
      error: (error) => {
        this.errorGuardado.set(mensajeDeApi(error));
        this.guardando.set(false);
      },
    });
  }
}
