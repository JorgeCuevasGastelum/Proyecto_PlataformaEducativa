import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
export class DetalleMateria implements OnInit {
  protected readonly lista = inject(ListaMaterias);
  private readonly api = inject(MateriasApi);
  private readonly router = inject(Router);

  // Viene de la ruta /materias/:id
  readonly id = input<string>();

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
    return this.lista.materias().filter((o) => m.prerrequisitoIds.includes(o.id));
  });

  // Para el select: todas menos ella misma y las que ya son prerrequisito.
  protected readonly candidatas = computed(() => {
    const m = this.materia();
    if (!m) return [];
    return this.lista.materias().filter((o) => o.id !== m.id && !m.prerrequisitoIds.includes(o.id));
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

  ngOnInit(): void {
    this.cargar();
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

    this.ocupado.set(true);
    this.mensaje.set(null);
    this.api.agregarPrerrequisito(m.id, prerrequisitoId).subscribe({
      next: (materia) => {
        this.materia.set(materia);
        this.mensaje.set({ tipo: 'exito', texto: 'Se agregó el prerrequisito.' });
        this.elegido.set('');
        this.ocupado.set(false);
        this.lista.recargar();
      },
      error: (e) => {
        this.mensaje.set({ tipo: 'error', texto: mensajeDeApi(e) });
        this.ocupado.set(false);
      },
    });
  }

  protected quitarPrerrequisito(prerrequisitoId: number): void {
    const m = this.materia();
    if (!m) return;

    this.ocupado.set(true);
    this.mensaje.set(null);
    this.api.quitarPrerrequisito(m.id, prerrequisitoId).subscribe({
      next: (materia) => {
        this.materia.set(materia);
        this.mensaje.set({ tipo: 'exito', texto: 'Se quitó el prerrequisito.' });
        this.ocupado.set(false);
        this.lista.recargar();
      },
      error: (e) => {
        this.mensaje.set({ tipo: 'error', texto: mensajeDeApi(e) });
        this.ocupado.set(false);
      },
    });
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
}
