import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
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
  private readonly api = inject(AlumnosApi);
  private readonly router = inject(Router);
  protected readonly lista = inject(ListaAlumnos);

  // Viene de la ruta /alumnos/:id/editar; en /alumnos/nuevo no hay id.
  readonly id = input<string>();

  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly noExiste = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly errorGuardado = signal<string | null>(null);
  protected readonly minimoContrasena = LONGITUD_MINIMA_CONTRASENA;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    matricula: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    correoInstitucional: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    contrasena: ['', [Validators.required, Validators.minLength(LONGITUD_MINIMA_CONTRASENA)]],
    planDeEstudiosId: ['', Validators.required],
  });
  protected readonly campos = this.form.controls;

  ngOnInit(): void {
    if (!this.id()) return;
    // Al editar solo se cambian el nombre y el plan.
    this.campos.matricula.disable();
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
      next: (alumno) => {
        this.form.patchValue({ nombre: alumno.nombre, planDeEstudiosId: String(alumno.planDeEstudiosId) });
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
    const planDeEstudiosId = Number(datos.planDeEstudiosId);

    this.guardando.set(true);
    this.errorGuardado.set(null);

    const id = this.id();
    const peticion = id
      ? this.api.actualizar(Number(id), { nombre, planDeEstudiosId })
      : this.api.crear({
          matricula: datos.matricula.trim(),
          nombre,
          correoInstitucional: datos.correoInstitucional.trim(),
          contrasena: datos.contrasena,
          planDeEstudiosId,
        });

    peticion.subscribe({
      next: (alumno) => {
        this.form.markAsPristine();
        this.guardando.set(false);
        this.lista.recargar();
        this.router.navigate(['/alumnos', alumno.id]);
      },
      error: (e) => {
        this.errorGuardado.set(mensajeDeApi(e));
        this.guardando.set(false);
      },
    });
  }
}
