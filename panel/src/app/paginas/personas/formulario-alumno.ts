import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LONGITUD_MINIMA_CONTRASENA } from '../../modelos/tipos';
import { AlumnosApi } from '../../servicios/alumnos-api';
import { mensajeDeApi } from '../../servicios/errores';
import { ListaAlumnos } from '../../servicios/lista-alumnos';
import { NoEncontrado } from '../no-encontrado';

@Component({
  selector: 'app-formulario-alumno',
  imports: [ReactiveFormsModule, RouterLink, NoEncontrado],
  templateUrl: './formulario-alumno.html',
})
export class FormularioAlumno implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AlumnosApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly lista = inject(ListaAlumnos);

  readonly id = input<string>();
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly noExiste = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly errorGuardado = signal<string | null>(null);
  protected readonly minimoContrasena = LONGITUD_MINIMA_CONTRASENA;

  protected readonly form = this.fb.nonNullable.group({
    matricula: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(80)]],
    correoInstitucional: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    contrasena: ['', [Validators.required, Validators.minLength(LONGITUD_MINIMA_CONTRASENA)]],
    planDeEstudiosId: this.fb.control<number | null>(null, Validators.required),
  });
  protected readonly campos = this.form.controls;

  ngOnInit(): void {
    if (!this.id()) return;
    this.campos.matricula.disable();
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
      next: (alumno) => {
        this.form.patchValue({ nombre: alumno.nombre, planDeEstudiosId: alumno.planDeEstudiosId });
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
    const { matricula, nombre, correoInstitucional, contrasena, planDeEstudiosId } = this.form.getRawValue();
    if (this.form.invalid || planDeEstudiosId === null) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGuardado.set(null);
    const id = this.id();
    const cambios = { nombre: nombre.trim(), planDeEstudiosId };
    const peticion = id
      ? this.api.actualizar(id, cambios)
      : this.api.crear({ matricula: matricula.trim(), correoInstitucional, contrasena, ...cambios });

    peticion.subscribe({
      next: (alumno) => {
        this.form.markAsPristine();
        this.guardando.set(false);
        this.lista.recargar();
        if (!this.destroyRef.destroyed) this.router.navigate(['/alumnos', alumno.id]);
      },
      error: (error) => {
        this.errorGuardado.set(mensajeDeApi(error));
        this.guardando.set(false);
      },
    });
  }
}
