import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Materia, PlanDeEstudios } from '../../modelos/tipos';
import { ListaMaterias } from '../../servicios/lista-materias';
import { PlanesApi } from '../../servicios/planes-api';
import { mensajeDeApi, mensajesDelCuerpo } from '../../servicios/errores';

interface Mensaje {
  tipo: 'exito' | 'error';
  texto: string;
}

interface PlanEnPantalla {
  plan: PlanDeEstudios;
  carrera: string;
  materias: Materia[];
  creditos: number;
  faltantes: Materia[];
}

@Component({
  selector: 'app-pagina-planes',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pagina-planes.html',
})
export class PaginaPlanes {
  protected readonly lista = inject(ListaMaterias);
  private readonly api = inject(PlanesApi);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly mensaje = signal<Mensaje | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly filtroCarrera = signal(0);

  // La materia que eligieron en el select de un plan para agregársela.
  protected readonly planElegido = signal(0);
  protected readonly materiaElegida = signal('');

  protected readonly formCarrera = this.fb.group({
    clave: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
  });

  protected readonly formPlan = this.fb.group({
    clave: ['', [Validators.required, Validators.maxLength(20)]],
    carreraId: ['', Validators.required],
  });

  protected readonly planes = computed<PlanEnPantalla[]>(() => {
    const filtro = this.filtroCarrera();
    const todas = this.lista.materias();
    return this.lista
      .planes()
      .filter((plan) => !filtro || plan.carreraId === filtro)
      .map((plan) => {
        const materias = todas.filter((m) => plan.materiaIds.includes(m.id));
        return {
          plan,
          carrera: this.lista.carrera(plan.carreraId)?.nombre ?? `Carrera ${plan.carreraId}`,
          materias,
          creditos: materias.reduce((suma, m) => suma + m.creditos, 0),
          faltantes: todas.filter((m) => !plan.materiaIds.includes(m.id)),
        };
      });
  });

  tieneCambios(): boolean {
    return this.formCarrera.dirty || this.formPlan.dirty;
  }

  protected contarPlanes(carreraId: number): number {
    return this.lista.planes().filter((p) => p.carreraId === carreraId).length;
  }

  protected elegirCarrera(evento: Event): void {
    this.filtroCarrera.set(Number((evento.target as HTMLSelectElement).value));
  }

  protected elegirMateria(planId: number, evento: Event): void {
    this.planElegido.set(planId);
    this.materiaElegida.set((evento.target as HTMLSelectElement).value);
  }

  protected crearCarrera(): void {
    if (this.formCarrera.invalid) {
      this.formCarrera.markAllAsTouched();
      return;
    }
    const datos = this.formCarrera.getRawValue();

    this.ocupado.set(true);
    this.mensaje.set(null);
    this.api.crearCarrera({ clave: datos.clave.trim().toUpperCase(), nombre: datos.nombre.trim() }).subscribe({
      next: (carrera) => {
        this.mensaje.set({ tipo: 'exito', texto: `Se dio de alta la carrera ${carrera.clave} - ${carrera.nombre}.` });
        this.formCarrera.reset();
        this.ocupado.set(false);
        this.lista.recargar();
      },
      error: (e: HttpErrorResponse) => this.mostrarError(e),
    });
  }

  protected crearPlan(): void {
    if (this.formPlan.invalid) {
      this.formPlan.markAllAsTouched();
      return;
    }
    const datos = this.formPlan.getRawValue();

    this.ocupado.set(true);
    this.mensaje.set(null);
    this.api.crearPlan({ clave: datos.clave.trim().toUpperCase(), carreraId: Number(datos.carreraId) }).subscribe({
      next: (plan) => {
        this.mensaje.set({ tipo: 'exito', texto: `Se creó el plan ${plan.clave}. Ahora agrégale sus materias.` });
        this.formPlan.reset();
        this.ocupado.set(false);
        this.lista.recargar();
      },
      error: (e: HttpErrorResponse) => this.mostrarError(e),
    });
  }

  protected agregarMateria(fila: PlanEnPantalla): void {
    const materiaId = Number(this.materiaElegida());
    if (this.planElegido() !== fila.plan.id || !materiaId) return;
    const materia = this.lista.materia(materiaId);

    this.ocupado.set(true);
    this.mensaje.set(null);
    this.api.agregarMateria(fila.plan.id, materiaId).subscribe({
      next: () => {
        this.mensaje.set({ tipo: 'exito', texto: `Se agregó ${materia?.nombre ?? 'la materia'} al plan ${fila.plan.clave}.` });
        this.planElegido.set(0);
        this.materiaElegida.set('');
        this.ocupado.set(false);
        this.lista.recargar();
      },
      error: (e: HttpErrorResponse) => this.mostrarError(e),
    });
  }

  protected quitarMateria(fila: PlanEnPantalla, materia: Materia): void {
    const pregunta = `¿Quitar ${materia.clave} - ${materia.nombre} del plan ${fila.plan.clave}? Los alumnos de ese plan dejarán de verla en su oferta.`;
    if (!confirm(pregunta)) return;

    this.ocupado.set(true);
    this.mensaje.set(null);
    this.api.quitarMateria(fila.plan.id, materia.id).subscribe({
      next: () => {
        this.mensaje.set({ tipo: 'exito', texto: `Se quitó ${materia.nombre} del plan ${fila.plan.clave}.` });
        this.ocupado.set(false);
        this.lista.recargar();
      },
      error: (e: HttpErrorResponse) => this.mostrarError(e),
    });
  }

  // Los errores de validación (400) traen varios mensajes; los demás, uno.
  private mostrarError(e: HttpErrorResponse): void {
    const mensajes = e.status === 400 ? mensajesDelCuerpo(e.error) : [];
    this.mensaje.set({ tipo: 'error', texto: mensajes.length ? mensajes.join('. ') : mensajeDeApi(e) });
    this.ocupado.set(false);
  }
}
