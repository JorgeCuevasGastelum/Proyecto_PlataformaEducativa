import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { ConceptoDePago } from '../../modelos/tipos';
import { ListaPagos } from '../../servicios/lista-pagos';
import { PagosApi } from '../../servicios/pagos-api';
import { mensajeDeApi, mensajesDelCuerpo } from '../../servicios/errores';

@Component({
  selector: 'app-formulario-cargo',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './formulario-cargo.html',
})
export class FormularioCargo {
  protected readonly lista = inject(ListaPagos);
  private readonly api = inject(PagosApi);
  private readonly router = inject(Router);

  protected readonly guardando = signal(false);
  protected readonly erroresServidor = signal<string[]>([]);

  // Los select regresan texto; se convierten a número al guardar.
  protected readonly form = inject(FormBuilder).nonNullable.group({
    alumnoId: ['', Validators.required],
    periodoId: ['', Validators.required],
    concepto: ['inscripcion' as ConceptoDePago, Validators.required],
    monto: [0, [Validators.required, Validators.min(1)]],
    fechaLimite: ['', Validators.required],
  });

  protected get f() {
    return this.form.controls;
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

    const datos = this.form.getRawValue();
    this.api
      .registrarCargo({
        alumnoId: Number(datos.alumnoId),
        periodoId: Number(datos.periodoId),
        concepto: datos.concepto,
        monto: Number(datos.monto),
        fechaLimite: datos.fechaLimite,
      })
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this.lista.recargar();
          this.router.navigate(['/pagos']);
        },
        error: (e: HttpErrorResponse) => {
          const mensajes = e.status === 400 ? mensajesDelCuerpo(e.error) : [];
          this.erroresServidor.set(mensajes.length ? mensajes : [mensajeDeApi(e)]);
          this.guardando.set(false);
        },
      });
  }
}
