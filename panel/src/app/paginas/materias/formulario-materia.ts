import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NoEncontrado } from '../no-encontrado';
import { MateriasApi } from '../../servicios/materias-api';
import { ListaMaterias } from '../../servicios/lista-materias';
import { mensajeDeApi, mensajesDelCuerpo } from '../../servicios/errores';

@Component({
  selector: 'app-formulario-materia',
  imports: [ReactiveFormsModule, RouterLink, NoEncontrado],
  templateUrl: './formulario-materia.html',
})
export class FormularioMateria implements OnInit {
  private readonly lista = inject(ListaMaterias);
  private readonly api = inject(MateriasApi);
  private readonly router = inject(Router);

  // Viene de la ruta /materias/:id/editar; en /materias/nueva no hay id.
  readonly id = input<string>();

  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly noExiste = signal(false);
  protected readonly erroresServidor = signal<string[]>([]);
  // Si el servicio dice que la clave ya existe, el error se muestra junto al campo.
  protected readonly claveDuplicada = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    clave: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    descripcion: ['', [Validators.required, Validators.maxLength(255)]],
    creditos: [6, [Validators.required, Validators.min(1), Validators.max(12), Validators.pattern('^[0-9]+$')]],
  });

  protected get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    // La clave no se cambia una vez creada: así la conocen los planes y el portal.
    this.f.clave.disable();
    this.cargando.set(true);
    this.api.obtener(Number(id)).subscribe({
      next: (materia) => {
        this.form.patchValue({
          clave: materia.clave,
          nombre: materia.nombre,
          descripcion: materia.descripcion,
          creditos: materia.creditos,
        });
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        if (e.status === 404 || e.status === 400) this.noExiste.set(true);
        else this.erroresServidor.set([mensajeDeApi(e)]);
        this.cargando.set(false);
      },
    });
  }

  tieneCambios(): boolean {
    return this.form.dirty;
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.erroresServidor.set([]);
    this.claveDuplicada.set(null);

    const id = this.id();
    const datos = this.form.getRawValue();
    const cambios = { nombre: datos.nombre.trim(), descripcion: datos.descripcion.trim(), creditos: Number(datos.creditos) };
    const peticion = id
      ? this.api.actualizar(Number(id), cambios)
      : this.api.crear({ clave: datos.clave.trim().toUpperCase(), ...cambios, prerrequisitoIds: [] });

    peticion.subscribe({
      next: (materia) => {
        this.form.markAsPristine();
        this.lista.recargar();
        // Al detalle, que es donde se agregan los prerrequisitos.
        this.router.navigate(['/materias', materia.id]);
      },
      error: (e: HttpErrorResponse) => {
        const tipo = (e.error as { error?: { tipo?: string } } | null)?.error?.tipo;
        if (tipo === 'ClaveDeMateriaDuplicadaError') {
          this.claveDuplicada.set(mensajeDeApi(e));
        } else {
          const mensajes = e.status === 400 ? mensajesDelCuerpo(e.error) : [];
          this.erroresServidor.set(mensajes.length ? mensajes : [mensajeDeApi(e)]);
        }
        this.guardando.set(false);
      },
    });
  }
}
