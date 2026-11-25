import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NoEncontrado } from '../no-encontrado';
import { AvisosApi } from '../../servicios/avisos-api';
import { ListaAvisos } from '../../servicios/lista-avisos';
import { mensajeDeApi, mensajesDelCuerpo } from '../../servicios/errores';

@Component({
  selector: 'app-formulario-aviso',
  imports: [ReactiveFormsModule, RouterLink, NoEncontrado],
  templateUrl: './formulario-aviso.html',
})
export class FormularioAviso implements OnInit {
  protected readonly lista = inject(ListaAvisos);
  private readonly api = inject(AvisosApi);
  private readonly router = inject(Router);

  // Viene de la ruta /avisos/:id/editar; en /avisos/nuevo no hay id.
  readonly id = input<string>();

  protected readonly guardando = signal(false);
  protected readonly noExiste = signal(false);
  protected readonly erroresServidor = signal<string[]>([]);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    periodoId: ['', Validators.required],
    titulo: ['', [Validators.required, Validators.maxLength(120)]],
    contenido: ['', Validators.required],
  });

  protected get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      // Al crear, se propone el período que se está viendo en la lista.
      const periodo = this.lista.periodoElegido();
      if (periodo) this.form.patchValue({ periodoId: String(periodo) });
      return;
    }

    // Al editar, el período ya no se cambia.
    this.f.periodoId.disable();
    this.api.obtener(Number(id)).subscribe({
      next: (aviso) =>
        this.form.patchValue({
          periodoId: String(aviso.periodoId),
          titulo: aviso.titulo,
          contenido: aviso.contenido,
        }),
      error: (e: HttpErrorResponse) => {
        if (e.status === 404) this.noExiste.set(true);
        else this.erroresServidor.set([mensajeDeApi(e)]);
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

    const id = this.id();
    const datos = this.form.getRawValue();
    const peticion = id
      ? this.api.editar(Number(id), { titulo: datos.titulo, contenido: datos.contenido })
      : this.api.publicar({ periodoId: Number(datos.periodoId), titulo: datos.titulo, contenido: datos.contenido });

    peticion.subscribe({
      next: (aviso) => {
        this.form.markAsPristine();
        // Que la lista muestre el período del aviso que se acaba de guardar.
        this.lista.periodoId.set(aviso.periodoId);
        this.lista.recargar();
        this.router.navigate(['/avisos']);
      },
      error: (e: HttpErrorResponse) => {
        const mensajes = e.status === 400 ? mensajesDelCuerpo(e.error) : [];
        this.erroresServidor.set(mensajes.length ? mensajes : [mensajeDeApi(e)]);
        this.guardando.set(false);
      },
    });
  }
}
