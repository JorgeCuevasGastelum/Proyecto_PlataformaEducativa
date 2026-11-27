import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
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
  private readonly api = inject(MaestrosApi);
  private readonly lista = inject(ListaMaestros);
  private readonly router = inject(Router);

  // Viene de la ruta /maestros/:id/editar; en /maestros/nuevo no hay id.
  readonly id = input<string>();

  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly noExiste = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly errorGuardado = signal<string | null>(null);
  protected readonly minimoContrasena = LONGITUD_MINIMA_CONTRASENA;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    numeroEmpleado: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    correoInstitucional: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    contrasena: ['', [Validators.required, Validators.minLength(LONGITUD_MINIMA_CONTRASENA)]],
  });
  protected readonly campos = this.form.controls;

  ngOnInit(): void {
    if (!this.id()) return;
    // Al editar solo se cambia el nombre.
    this.campos.numeroEmpleado.disable();
    this.campos.correoInstitucional.disable();
    this.campos.contrasena.disable();
    this.cargar();
  }

  tieneCambios(): boolean {
    return this.form.dirty;
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.api.obtener(Number(this.id())).subscribe({
      next: (maestro) => {
        this.form.patchValue({ nombre: maestro.nombre });
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        if (e.status === 404 || e.status === 400) this.noExiste.set(true);
        else this.errorCarga.set(mensajeDeApi(e));
        this.cargando.set(false);
      },
    });
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const datos = this.form.getRawValue();
    const nombre = datos.nombre.trim();

    this.guardando.set(true);
    this.errorGuardado.set(null);

    const id = this.id();
    const peticion = id
      ? this.api.actualizar(Number(id), nombre)
      : this.api.crear({
          numeroEmpleado: datos.numeroEmpleado.trim(),
          nombre,
          correoInstitucional: datos.correoInstitucional.trim(),
          contrasena: datos.contrasena,
        });

    peticion.subscribe({
      next: (maestro) => {
        this.form.markAsPristine();
        this.guardando.set(false);
        this.lista.recargar();
        this.router.navigate(['/maestros', maestro.id]);
      },
      error: (e) => {
        this.errorGuardado.set(mensajeDeApi(e));
        this.guardando.set(false);
      },
    });
  }
}
