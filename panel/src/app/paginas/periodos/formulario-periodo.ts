import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NoEncontrado } from '../no-encontrado';
import { PeriodosApi } from '../../servicios/periodos-api';
import { ListaPeriodos } from '../../servicios/lista-periodos';
import { mensajeDeApi, mensajesDelCuerpo } from '../../servicios/errores';

@Component({
  selector: 'app-formulario-periodo',
  imports: [ReactiveFormsModule, RouterLink, NoEncontrado],
  templateUrl: './formulario-periodo.html',
})
export class FormularioPeriodo implements OnInit {
  private readonly lista = inject(ListaPeriodos);
  private readonly api = inject(PeriodosApi);
  private readonly router = inject(Router);

  // Viene de la ruta /periodos/:id/editar; en /periodos/nuevo no hay id.
  readonly id = input<string>();

  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly noExiste = signal(false);
  protected readonly erroresServidor = signal<string[]>([]);
  // Si el servicio dice que la clave ya existe, el error se muestra junto al campo.
  protected readonly claveDuplicada = signal<string | null>(null);
  protected readonly errorFechas = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    clave: ['', [Validators.required, Validators.maxLength(20)]],
    fechaAperturaCarga: ['', Validators.required],
    fechaCierreCarga: ['', Validators.required],
    creditosMaximos: [0, [Validators.required, Validators.min(1), Validators.pattern('^[0-9]+$')]],
  });

  protected get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    this.cargando.set(true);
    this.api.obtener(Number(id)).subscribe({
      next: (periodo) => {
        this.form.patchValue({
          clave: periodo.clave,
          fechaAperturaCarga: periodo.fechaAperturaCarga.slice(0, 10),
          fechaCierreCarga: periodo.fechaCierreCarga.slice(0, 10),
          creditosMaximos: periodo.creditosMaximos,
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
    this.errorFechas.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const datos = this.form.getRawValue();

    if (datos.fechaCierreCarga <= datos.fechaAperturaCarga) {
      this.errorFechas.set('La fecha de cierre debe ser después de la de apertura.');
      return;
    }

    this.guardando.set(true);
    this.erroresServidor.set([]);
    this.claveDuplicada.set(null);

    const id = this.id();
    const cuerpo = {
      clave: datos.clave.trim(),
      fechaAperturaCarga: datos.fechaAperturaCarga,
      fechaCierreCarga: datos.fechaCierreCarga,
      creditosMaximos: Number(datos.creditosMaximos),
    };
    const peticion = id ? this.api.actualizar(Number(id), cuerpo) : this.api.crear(cuerpo);

    peticion.subscribe({
      next: () => {
        this.form.markAsPristine();
        this.lista.recargar();
        this.router.navigate(['/periodos']);
      },
      error: (e: HttpErrorResponse) => {
        // El único 409 que llega hasta aquí es la clave repetida: se muestra junto a ese campo.
        if (e.status === 409) {
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
