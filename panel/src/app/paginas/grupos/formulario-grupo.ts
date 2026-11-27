import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { DiaSemana } from '../../modelos/tipos';
import { GruposApi } from '../../servicios/grupos-api';
import type { BloqueDeHorarioNuevo } from '../../servicios/grupos-api';
import { ListaGrupos } from '../../servicios/lista-grupos';
import { ListaMaterias } from '../../servicios/lista-materias';
import { PeriodosApi } from '../../servicios/periodos-api';
import { mensajeDeApi, mensajesDelCuerpo } from '../../servicios/errores';

const DIAS: { valor: DiaSemana; nombre: string }[] = [
  { valor: 'lunes', nombre: 'Lunes' },
  { valor: 'martes', nombre: 'Martes' },
  { valor: 'miercoles', nombre: 'Miércoles' },
  { valor: 'jueves', nombre: 'Jueves' },
  { valor: 'viernes', nombre: 'Viernes' },
  { valor: 'sabado', nombre: 'Sábado' },
];

@Component({
  selector: 'app-formulario-grupo',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './formulario-grupo.html',
})
export class FormularioGrupo implements OnInit {
  protected readonly lista = inject(ListaGrupos);
  protected readonly materias = inject(ListaMaterias);
  private readonly api = inject(GruposApi);
  private readonly periodosApi = inject(PeriodosApi);
  private readonly router = inject(Router);

  protected readonly dias = DIAS;
  protected readonly guardando = signal(false);
  protected readonly erroresServidor = signal<string[]>([]);

  // Son 2 bloques fijos: el primero es obligatorio y el segundo es opcional.
  protected readonly form = inject(FormBuilder).nonNullable.group({
    materiaId: ['', Validators.required],
    periodoId: ['', Validators.required],
    clave: ['', [Validators.required, Validators.maxLength(10)]],
    maestroId: ['', Validators.required],
    cupoMaximo: [0, [Validators.required, Validators.min(1), Validators.pattern('^[0-9]+$')]],
    dia1: ['lunes' as DiaSemana, Validators.required],
    inicio1: ['', Validators.required],
    fin1: ['', Validators.required],
    dia2: ['' as DiaSemana | ''],
    inicio2: [''],
    fin2: [''],
  });

  protected get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    // Se propone el período que se está viendo en la lista.
    const periodo = this.lista.periodoElegido();
    if (periodo) {
      this.form.patchValue({ periodoId: String(periodo) });
      return;
    }

    // Si entraron directo a /grupos/nuevo la lista aún no tiene los períodos:
    // se piden y se propone el de carga abierta (o el último), igual que en la lista.
    this.periodosApi.listar().subscribe((periodos) => {
      if (this.f.periodoId.value) return;
      const abierto = periodos.find((p) => p.habilitado) ?? periodos[periodos.length - 1];
      if (abierto) this.form.patchValue({ periodoId: String(abierto.id) });
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

    const datos = this.form.getRawValue();

    const horario: BloqueDeHorarioNuevo[] = [
      { diaSemana: datos.dia1, horaInicio: datos.inicio1, horaFin: datos.fin1 },
    ];
    if (datos.dia2) {
      horario.push({ diaSemana: datos.dia2, horaInicio: datos.inicio2, horaFin: datos.fin2 });
    }

    this.guardando.set(true);
    this.erroresServidor.set([]);

    this.api
      .abrir({
        materiaId: Number(datos.materiaId),
        periodoId: Number(datos.periodoId),
        clave: datos.clave.trim(),
        maestroId: Number(datos.maestroId),
        cupoMaximo: Number(datos.cupoMaximo),
        horario,
      })
      .subscribe({
        next: (grupo) => {
          this.form.markAsPristine();
          // Que la lista muestre el período del grupo que se acaba de abrir.
          this.lista.periodoId.set(grupo.periodoId);
          this.lista.recargar();
          this.router.navigate(['/grupos']);
        },
        error: (e: HttpErrorResponse) => {
          const mensajes = e.status === 400 ? mensajesDelCuerpo(e.error) : [];
          this.erroresServidor.set(mensajes.length ? mensajes : [mensajeDeApi(e)]);
          this.guardando.set(false);
        },
      });
  }
}
