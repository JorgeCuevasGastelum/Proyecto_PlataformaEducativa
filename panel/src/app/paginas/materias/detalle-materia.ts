import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Observable } from 'rxjs';
import type { Materia } from '../../modelos/tipos';
import { NoEncontrado } from '../no-encontrado';
import { MateriasApi } from '../../servicios/materias-api';
import { ListaMaterias } from '../../servicios/lista-materias';
import { mensajeDeApi } from '../../servicios/errores';

interface Mensaje {
  tipo: 'exito' | 'error';
  texto: string;
}

@Component({
  selector: 'app-detalle-materia',
  imports: [RouterLink, NoEncontrado],
  templateUrl: './detalle-materia.html',
})
export class DetalleMateria {
  protected readonly lista = inject(ListaMaterias);
  private readonly api = inject(MateriasApi);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly materia = signal<Materia | null>(null);
  protected readonly cargando = signal(true);
  protected readonly noExiste = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly mensaje = signal<Mensaje | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly elegido = signal('');

  protected readonly prerrequisitos = computed(() => {
    const m = this.materia();
    if (!m) return [];
    return m.prerrequisitoIds.map((id) => this.lista.materia(id) ?? { id, clave: '?', nombre: `Materia ${id}` });
  });

  // Para el select: todas menos ella misma y las que ya son prerrequisito.
  protected readonly candidatas = computed(() => {
    const m = this.materia();
    if (!m) return [];
    return [...this.lista.materias()]
      .filter((o) => o.id !== m.id && !m.prerrequisitoIds.includes(o.id))
      .sort((a, b) => a.clave.localeCompare(b.clave));
  });

  // Las materias que la piden como requisito y los planes donde aparece: es lo que impide borrarla.
  protected readonly requeridaPor = computed(() => {
    const m = this.materia();
    return m ? this.lista.materias().filter((o) => o.prerrequisitoIds.includes(m.id)) : [];
  });

  protected readonly enPlanes = computed(() => {
    const m = this.materia();
    return m ? this.lista.planes().filter((p) => p.materiaIds.includes(m.id)) : [];
  });

  constructor() {
    // Al ir de una materia a otra (por ejemplo, desde un prerrequisito) Angular reutiliza
    // este componente, así que se vuelve a cargar cada vez que cambia el id de la ruta.
    effect(() => {
      this.id();
      untracked(() => {
        this.noExiste.set(false);
        this.mensaje.set(null);
        this.cargar();
      });
    });
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.api.obtener(Number(this.id())).subscribe({
      next: (materia) => {
        this.materia.set(materia);
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        // Un id que no es número también es "no existe" (el servicio responde 400).
        if (e.status === 404 || e.status === 400) this.noExiste.set(true);
        else this.errorCarga.set(mensajeDeApi(e));
        this.cargando.set(false);
      },
    });
  }

  protected elegir(evento: Event): void {
    this.elegido.set((evento.target as HTMLSelectElement).value);
  }

  protected agregarPrerrequisito(): void {
    const m = this.materia();
    const prerrequisitoId = Number(this.elegido());
    if (!m || !prerrequisitoId) return;

    this.cambiarSeriacion(this.api.agregarPrerrequisito(m.id, prerrequisitoId), 'Se agregó el prerrequisito.');
    this.elegido.set('');
  }

  protected quitarPrerrequisito(prerrequisitoId: number): void {
    const m = this.materia();
    if (!m) return;
    this.cambiarSeriacion(this.api.quitarPrerrequisito(m.id, prerrequisitoId), 'Se quitó el prerrequisito.');
  }

  protected eliminar(): void {
    const m = this.materia();
    if (!m) return;
    if (!confirm(`¿Seguro que quieres eliminar ${m.clave} - ${m.nombre}? Esto no se puede deshacer.`)) return;

    this.ocupado.set(true);
    this.mensaje.set(null);
    this.api.eliminar(m.id).subscribe({
      next: () => {
        this.lista.recargar();
        this.router.navigate(['/materias']);
      },
      error: (e) => {
        this.mensaje.set({ tipo: 'error', texto: mensajeDeApi(e) });
        this.ocupado.set(false);
      },
    });
  }

  private cambiarSeriacion(peticion: Observable<Materia>, exito: string): void {
    this.ocupado.set(true);
    this.mensaje.set(null);
    peticion.subscribe({
      next: (materia) => {
        this.materia.set(materia);
        this.mensaje.set({ tipo: 'exito', texto: exito });
        this.ocupado.set(false);
        this.lista.recargar();
      },
      error: (e) => {
        this.mensaje.set({ tipo: 'error', texto: mensajeDeApi(e) });
        this.ocupado.set(false);
      },
    });
  }
}
