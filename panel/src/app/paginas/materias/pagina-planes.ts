import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Observable } from 'rxjs';
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

  protected readonly formCarrera = this.fb.group({
    clave: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
  });

  protected readonly formPlan = this.fb.group({
    clave: ['', [Validators.required, Validators.maxLength(20)]],
    carreraId: ['', Validators.required],
  });

  protected readonly planesPorCarrera = computed(() => {
    const conteo = new Map<number, number>();
    for (const p of this.lista.planes()) conteo.set(p.carreraId, (conteo.get(p.carreraId) ?? 0) + 1);
    return conteo;
  });

  protected readonly planes = computed<PlanEnPantalla[]>(() => {
    const filtro = this.filtroCarrera();
    const todas = [...this.lista.materias()].sort((a, b) => a.clave.localeCompare(b.clave));
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

  protected elegirCarrera(evento: Event): void {
    this.filtroCarrera.set(Number((evento.target as HTMLSelectElement).value));
  }

  protected crearCarrera(): void {
    if (this.formCarrera.invalid) {
      this.formCarrera.markAllAsTouched();
      return;
    }
    const datos = this.formCarrera.getRawValue();
    this.ejecutar(
      this.api.crearCarrera({ clave: datos.clave.trim().toUpperCase(), nombre: datos.nombre.trim() }),
      (c) => `Se dio de alta la carrera ${c.clave} - ${c.nombre}.`,
      () => this.formCarrera.reset(),
    );
  }

  protected crearPlan(): void {
    if (this.formPlan.invalid) {
      this.formPlan.markAllAsTouched();
      return;
    }
    const datos = this.formPlan.getRawValue();
    this.ejecutar(
      this.api.crearPlan({ clave: datos.clave.trim().toUpperCase(), carreraId: Number(datos.carreraId) }),
      (p) => `Se creó el plan ${p.clave}. Ahora agrégale sus materias.`,
      () => this.formPlan.reset(),
    );
  }

  protected agregarMateria(fila: PlanEnPantalla, select: HTMLSelectElement): void {
    const materiaId = Number(select.value);
    if (!materiaId) return;
    const materia = this.lista.materia(materiaId);
    this.ejecutar(
      this.api.agregarMateria(fila.plan.id, materiaId),
      () => `Se agregó ${materia?.nombre ?? 'la materia'} al plan ${fila.plan.clave}.`,
      () => (select.value = ''),
    );
  }

  protected quitarMateria(fila: PlanEnPantalla, materia: Materia): void {
    const aviso = `¿Quitar ${materia.clave} - ${materia.nombre} del plan ${fila.plan.clave}? Los alumnos de ese plan dejarán de verla en su oferta.`;
    if (!confirm(aviso)) return;
    this.ejecutar(
      this.api.quitarMateria(fila.plan.id, materia.id),
      () => `Se quitó ${materia.nombre} del plan ${fila.plan.clave}.`,
    );
  }

  // Todas las acciones de la página siguen el mismo camino: avisar, recargar las listas y limpiar.
  private ejecutar<T>(
    peticion: Observable<T>,
    exito: (valor: T) => string,
    despues?: () => void,
  ): void {
    this.ocupado.set(true);
    this.mensaje.set(null);
    peticion.subscribe({
      next: (valor) => {
        this.mensaje.set({ tipo: 'exito', texto: exito(valor) });
        this.ocupado.set(false);
        despues?.();
        this.lista.recargar();
      },
      error: (e) => {
        const mensajes = e instanceof HttpErrorResponse && e.status === 400 ? mensajesDelCuerpo(e.error) : [];
        this.mensaje.set({ tipo: 'error', texto: mensajes.length ? mensajes.join('. ') : mensajeDeApi(e) });
        this.ocupado.set(false);
      },
    });
  }
}
